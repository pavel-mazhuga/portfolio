# video-flow: assets for `lab/video-flow-scrub`

Builds two frame-synced `.af` files from a video: the color frames and the optical flow between them.

```bash
cd frontend

# once: Python 3.11+ venv with CPU torch (≈1 GB download)
python3 -m venv scripts/video-flow/.venv
scripts/video-flow/.venv/bin/pip install --index-url https://download.pytorch.org/whl/cpu \
  --extra-index-url https://pypi.org/simple -r scripts/video-flow/requirements.txt

# source: needvision/frontend/public/static/videos/underwater2.mp4 (Git LFS)
# sha256 8b9cc2b226a95e96e52447f9d39693d1806b004c1d531b8499733c87a9c08a69
bash scripts/video-flow/build.sh path/to/underwater2.mp4
# -> public/static/videos/video-flow-scrub/underwater2_{color,flow}.af

# optional: leave-one-out quality check (rebuild frame k from k-1 and k+1, PSNR per mode)
scripts/video-flow/.venv/bin/python scripts/video-flow/flow.py eval scripts/video-flow/.work/frames
```

Needs `git`, `node` and `npm` on PATH. ffmpeg comes from `ffmpeg-static` (via ActiveFrame), so a system
ffmpeg is not required. Runtime: ~8 min on 8 CPU cores for 135 frames (RAFT large, 2 directions × 134 pairs).

## Steps

1. `flow.py frames`: decode, drop duplicate frames. The source is ~24 fps content in a 60 fps
   container (350 frames, only 135 unique); interpolating between duplicates would do nothing and
   make the motion stop-and-go. `frames.json` keeps the source index of every kept frame.
2. Lossless intermediate of the kept frames, cut straight from the source with `select`
   (stays in YUV, no colour-matrix round trip).
3. `flow.py flow`: RAFT large (torchvision, `C_T_SKHT_V2` weights, 12 iterations) at 960×540,
   forward and backward. Each pair is written as a grayscale atlas `1920×1088`:
   `[fwd.x | fwd.y]` over `[bwd.x | bwd.y]`, cells padded from 540 to 544 rows so H.264 macroblocks
   never straddle two cells. Value `127.5 + flow / scale * 127.5`, `scale` = max |flow| of the pair.
   `FLOW_METHOD=dis` uses OpenCV DIS instead (seconds instead of minutes, a bit worse on hard frames).
4. `af.js` from ActiveFrame, pinned to commit `686d123` with `ffmpeg-static@5.3.0` and `mp4box@2.3.0`:
   color `1920 h264 gop 5 crf 23`, flow `1920 h264 gop 5 crf 24` (crf 16 → 24 shrinks the flow file 5.1 → 2.3 MB for +0.03 px mean flow error).
5. `flow.py inject`: adds `flow` (layout, per-pair scales, source frame map) to the flow `.af` manifest.

Grayscale instead of RG: in `yuv420p` the chroma planes are quarter resolution, so flow in R/G would
lose detail and pick up colour-conversion error; luma keeps full resolution of the atlas.

Env overrides: `COLOR_CRF`, `FLOW_CRF`, `GOP`, `FLOW_METHOD`, `WORK`, `PY`.
Outputs are reproducible from the same inputs and pinned versions, but not byte-identical across
machines (RAFT on CPU threads, x264 build).
