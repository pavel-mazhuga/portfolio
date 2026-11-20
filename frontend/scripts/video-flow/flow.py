"""Offline step of the video-flow-scrub lab demo.

frames  -> dedupe source frames, write unique color frames as PNG
flow    -> forward + backward optical flow between neighbouring unique frames,
           packed as a grayscale 2x2 atlas PNG per pair (fx, fy / bx, by)
inject  -> put flow metadata (per-pair range, atlas layout, source frame map) into the .af manifest
eval    -> leave-one-out check: rebuild frame k from k-1 and k+1 at t=0.5, print PSNR per mode
"""

import argparse
import json
import struct
from pathlib import Path

import cv2
import numpy as np

# Flow is computed and stored at half the color resolution.
FLOW_W, FLOW_H = 960, 540
# Atlas cells are padded to a multiple of 16 rows so H.264 macroblocks never straddle two cells.
CELL_H = 544
ATLAS_W, ATLAS_H = FLOW_W * 2, CELL_H * 2


def read_frames(src):
    cap = cv2.VideoCapture(str(src))
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        yield frame


def cmd_frames(args):
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    kept, last = [], None
    for i, frame in enumerate(read_frames(args.src)):
        small = cv2.cvtColor(cv2.resize(frame, (480, 270), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        small = small.astype(np.float32)
        # The source is ~24 fps content in a 60 fps container: 2-3 identical frames in a row.
        # Interpolating between duplicates does nothing, so only frames that actually changed are kept.
        if last is None or np.abs(small - last).mean() >= args.dup_threshold:
            cv2.imwrite(str(out / f"{len(kept):04d}.png"), frame)
            kept.append(i)
            last = small
    (out / "frames.json").write_text(json.dumps({"sourceFrames": kept, "sourceTotal": i + 1}))
    print(f"kept {len(kept)} of {i + 1} frames")


class Raft:
    def __init__(self, threads, iters):
        import torch
        from torchvision.models.optical_flow import Raft_Large_Weights, raft_large

        torch.set_num_threads(threads)
        torch.manual_seed(0)
        self.torch = torch
        self.iters = iters
        self.model = raft_large(weights=Raft_Large_Weights.C_T_SKHT_V2).eval()

    def prep(self, img):
        t = self.torch.from_numpy(img[:, :, ::-1].copy()).permute(2, 0, 1)[None].float() / 127.5 - 1
        # RAFT needs sides divisible by 8: 540 -> 544
        return self.torch.nn.functional.pad(t, (0, 0, 2, 2), mode="replicate")

    def __call__(self, a, b):
        with self.torch.inference_mode():
            flow = self.model(self.prep(a), self.prep(b), num_flow_updates=self.iters)[-1]
        return flow[0, :, 2:-2].permute(1, 2, 0).numpy()


class Dis:
    def __init__(self):
        self.dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)

    def __call__(self, a, b):
        g = lambda x: cv2.cvtColor(x, cv2.COLOR_BGR2GRAY)
        return self.dis.calc(g(a), g(b), None)


def load_small(path):
    return cv2.resize(cv2.imread(str(path)), (FLOW_W, FLOW_H), interpolation=cv2.INTER_AREA)


def to_cell(channel, scale):
    v = np.clip(np.round(127.5 + channel / scale * 127.5), 0, 255).astype(np.uint8)
    # replicate the last row into the 4 padding rows
    return np.vstack([v, np.repeat(v[-1:], CELL_H - FLOW_H, axis=0)])


def cmd_flow(args):
    frames = sorted(Path(args.frames).glob("*.png"))
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    estimate = Raft(args.threads, args.iters) if args.method == "raft" else Dis()
    scales = []
    prev = load_small(frames[0])
    for k in range(len(frames)):
        if k + 1 < len(frames):
            nxt = load_small(frames[k + 1])
            fwd, bwd = estimate(prev, nxt), estimate(nxt, prev)
            scale = float(max(np.abs(fwd).max(), np.abs(bwd).max(), 0.5))
            prev = nxt
        else:
            # last frame has no pair; keep frame count equal to the color .af
            fwd = bwd = np.zeros((FLOW_H, FLOW_W, 2), np.float32)
            scale = 1.0
        scales.append(round(scale, 4))
        top = np.hstack([to_cell(fwd[..., 0], scale), to_cell(fwd[..., 1], scale)])
        bottom = np.hstack([to_cell(bwd[..., 0], scale), to_cell(bwd[..., 1], scale)])
        cv2.imwrite(str(out / f"{k:04d}.png"), np.vstack([top, bottom]))
        print(f"flow {k + 1}/{len(frames)} scale {scale:.2f}px", flush=True)
    meta = {
        "method": args.method,
        "width": FLOW_W,
        "height": FLOW_H,
        "cellHeight": CELL_H,
        "atlasWidth": ATLAS_W,
        "atlasHeight": ATLAS_H,
        "scales": scales,
    }
    (out / "flow.json").write_text(json.dumps(meta))


def cmd_inject(args):
    """Add `flow` metadata to the JSON manifest that af.js appends to the .af file."""
    data = Path(args.af).read_bytes()
    (offset,) = struct.unpack("<I", data[-4:])
    manifest = json.loads(data[offset:-4])
    extra = json.loads(Path(args.meta).read_text())
    if args.frames_meta:
        extra.update(json.loads(Path(args.frames_meta).read_text()))
    manifest[args.key] = extra
    Path(args.af).write_bytes(data[:offset] + json.dumps(manifest).encode() + struct.pack("<I", offset))


def warp(img, flow_px):
    """Sample img at p + flow(p) (backward warp), like texture(tex, uv + flow) in the shader."""
    h, w = img.shape[:2]
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return cv2.remap(img, gx + flow_px[..., 0], gy + flow_px[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def interpolate(a, b, f01, f10, t, occlusion=True):
    """Same math as the fragment shader (Super SloMo style intermediate flow + fwd/bwd consistency weights)."""
    ft0 = -(1 - t) * t * f01 + t * t * f10
    ft1 = (1 - t) * (1 - t) * f01 - t * (1 - t) * f10
    wa, wb = 1 - t, t
    if occlusion:
        # consistency error at the sampled points: f01(q) + f10(q + f01(q)) ~ 0 when visible in both
        e0 = np.linalg.norm(warp(f01, ft0) + warp(f10, ft0 + warp(f01, ft0)), axis=2)
        e1 = np.linalg.norm(warp(f10, ft1) + warp(f01, ft1 + warp(f10, ft1)), axis=2)
        wa = wa * np.exp(-((e0 / 2.0) ** 2))[..., None] + 1e-4
        wb = wb * np.exp(-((e1 / 2.0) ** 2))[..., None] + 1e-4
    out = (warp(a, ft0) * wa + warp(b, ft1) * wb) / (wa + wb)
    return out


def psnr(x, y):
    mse = np.mean((x.astype(np.float32) - y.astype(np.float32)) ** 2)
    return 10 * np.log10(255**2 / max(mse, 1e-6))


def cmd_eval(args):
    frames = sorted(Path(args.frames).glob("*.png"))
    estimate = Raft(args.threads, args.iters) if args.method == "raft" else Dis()
    ks = list(range(1, len(frames) - 1, args.step))
    rows = []
    for k in ks:
        a, gt, b = (load_small(frames[j]).astype(np.float32) for j in (k - 1, k, k + 1))
        f01, f10 = estimate(a.astype(np.uint8), b.astype(np.uint8)), estimate(b.astype(np.uint8), a.astype(np.uint8))
        rows.append(
            (
                psnr(a, gt),
                psnr((a + b) / 2, gt),
                psnr(interpolate(a, b, f01, f10, 0.5, occlusion=False), gt),
                psnr(interpolate(a, b, f01, f10, 0.5), gt),
            )
        )
    r = np.array(rows)
    print(f"pairs evaluated: {len(ks)} (leave-one-out, t=0.5, {FLOW_W}x{FLOW_H})")
    for name, col in zip(["none (nearest)", "crossfade", "flow", "flow+occlusion"], r.T):
        print(f"{name:16s} PSNR mean {col.mean():.2f} dB  min {col.min():.2f} dB")


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("frames")
    s.add_argument("src")
    s.add_argument("out")
    s.add_argument("--dup-threshold", type=float, default=0.3, help="mean abs luma diff (0..255) at 480x270")
    for name in ("flow", "eval"):
        s = sub.add_parser(name)
        s.add_argument("frames")
        if name == "flow":
            s.add_argument("out")
        else:
            s.add_argument("--step", type=int, default=6)
        s.add_argument("--method", choices=["raft", "dis"], default="raft")
        s.add_argument("--threads", type=int, default=8)
        s.add_argument("--iters", type=int, default=12)
    s = sub.add_parser("inject")
    s.add_argument("af")
    s.add_argument("meta")
    s.add_argument("--frames-meta")
    s.add_argument("--key", default="flow")
    args = p.parse_args()
    {"frames": cmd_frames, "flow": cmd_flow, "inject": cmd_inject, "eval": cmd_eval}[args.cmd](args)


if __name__ == "__main__":
    main()
