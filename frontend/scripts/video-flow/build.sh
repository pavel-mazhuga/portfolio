#!/usr/bin/env bash
# Builds the two synced .af files for the video-flow-scrub lab demo. See README.md.
# Usage: bash scripts/video-flow/build.sh <source.mp4> [out-dir] (run from frontend/)
set -euo pipefail

SRC="${1:?usage: build.sh <source.mp4> [out-dir]}"
OUT="${2:-public/static/videos/video-flow-scrub}"
NAME="$(basename "${SRC%.*}")"
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="${WORK:-$HERE/.work}"
PY="${PY:-$HERE/.venv/bin/python}"
FLOW_METHOD="${FLOW_METHOD:-raft}"
COLOR_CRF="${COLOR_CRF:-23}"
FLOW_CRF="${FLOW_CRF:-24}"
GOP="${GOP:-5}"
# activeframe has no releases or lockfile: pin the commit and the dependency versions
AF_REPO="https://github.com/activetheory/activeframe.git"
AF_COMMIT="686d12303995a48821073330d206a85da8ec22f6"
AF_DIR="$WORK/activeframe"

mkdir -p "$WORK" "$OUT"

if [[ ! -f "$AF_DIR/af.js" ]]; then
  git clone --quiet "$AF_REPO" "$AF_DIR"
  git -C "$AF_DIR" checkout --quiet "$AF_COMMIT"
  (cd "$AF_DIR" && npm install --no-save --no-audit --no-fund --silent ffmpeg-static@5.3.0 mp4box@2.3.0)
fi
FFMPEG="$(cd "$AF_DIR" && node -p "require('ffmpeg-static')")"

rm -rf "$WORK/frames" "$WORK/flow"

echo "1/5 dedupe source frames"
"$PY" "$HERE/flow.py" frames "$SRC" "$WORK/frames"

echo "2/5 lossless intermediate of the unique frames (stays in YUV, no colour matrix round trip)"
SELECT="$("$PY" -c "import json,sys;print('+'.join(f'eq(n\\\\,{i})' for i in json.load(open(sys.argv[1]))['sourceFrames']))" "$WORK/frames/frames.json")"
"$FFMPEG" -v error -y -i "$SRC" -an -vf "select='$SELECT',setpts=N/24/TB" -fps_mode passthrough \
  -c:v libx264 -qp 0 -pix_fmt yuv420p "$WORK/color.mkv"

echo "3/5 optical flow ($FLOW_METHOD), forward + backward"
"$PY" "$HERE/flow.py" flow "$WORK/frames" "$WORK/flow" --method "$FLOW_METHOD"
"$FFMPEG" -v error -y -framerate 24 -i "$WORK/flow/%04d.png" -c:v libx264 -qp 0 -pix_fmt yuv420p "$WORK/flow.mkv"

echo "4/5 pack .af"
node "$AF_DIR/af.js" "$WORK/color.mkv" "$OUT/${NAME}_color.af" 1920 h264 "$GOP" "$COLOR_CRF"
node "$AF_DIR/af.js" "$WORK/flow.mkv" "$OUT/${NAME}_flow.af" 1920 h264 "$GOP" "$FLOW_CRF"

echo "5/5 flow ranges into the flow .af manifest"
"$PY" "$HERE/flow.py" inject "$OUT/${NAME}_flow.af" "$WORK/flow/flow.json" --frames-meta "$WORK/frames/frames.json"

ls -l "$OUT"
