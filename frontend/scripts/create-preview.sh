#!/usr/bin/env bash
# Extract one frame from ~/Desktop/frontend-tutorials/<slug>/<name>.mp4 into lab preview.jpeg.
set -euo pipefail

PREVIEW_SIZE="${PREVIEW_SIZE:-2160}"
TUTORIALS_DIR="${TUTORIALS_DIR:-${HOME}/Desktop/frontend-tutorials}"

usage() {
  cat >&2 <<EOF
Usage: $(basename "$0") <demo-slug> [options]

Options:
  -t <time>     Timestamp: seconds (3.5), MM:SS, or HH:MM:SS[.ms]
  -f <frame>    Frame index (0-based); overrides -t
  -n <name>     Video base name (default: preview; uses <name>-opt.mp4 or <name>.mp4)
  -d <dir>      Tutorials root (default: ~/Desktop/frontend-tutorials)
  -o <path>     Output jpeg (default: frontend/public/static/img/lab/<slug>/preview.jpeg)
  -h            Help

Examples:
  $(basename "$0") flowmap
  $(basename "$0") flowmap -t 4.2
  $(basename "$0") flowmap -t 00:00:04.200 -n preview-2
  $(basename "$0") flowmap -f 120
EOF
}

die() {
  echo "$(basename "$0"): $*" >&2
  exit 1
}

parse_time_to_seconds() {
  local t="$1"
  if [[ "$t" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
    printf '%s\n' "$t"
    return
  fi
  if [[ "$t" =~ ^[0-9]{1,2}:[0-9]{2}$ ]]; then
    awk -F: '{ printf "%.6f\n", $1 * 60 + $2 }' <<<"$t"
    return
  fi
  if [[ "$t" =~ ^[0-9]{1,2}:[0-9]{2}:[0-9]{2}([.][0-9]+)?$ ]]; then
    awk -F: '{ printf "%.6f\n", $1 * 3600 + $2 * 60 + $3 }' <<<"$t"
    return
  fi
  die "invalid time: $t"
}

resolve_video() {
  local dir="$1"
  local name="$2"
  local opt="${dir}/${name}-opt.mp4"
  local plain="${dir}/${name}.mp4"
  if [[ -f "$opt" ]]; then
    printf '%s\n' "$opt"
  elif [[ -f "$plain" ]]; then
    printf '%s\n' "$plain"
  fi
}

video_duration() {
  ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"
}

slug=""
time_arg=""
frame_arg=""
video_name="preview"
out_path=""

[[ $# -ge 1 ]] || {
  usage
  exit 1
}
slug="$1"
shift

while getopts t:f:n:d:o:h flag; do
  case "${flag}" in
    t) time_arg="${OPTARG}" ;;
    f) frame_arg="${OPTARG}" ;;
    n) video_name="${OPTARG}" ;;
    d) TUTORIALS_DIR="${OPTARG}" ;;
    o) out_path="${OPTARG}" ;;
    h)
      usage
      exit 0
      ;;
    *) usage; exit 1 ;;
  esac
done

[[ -n "$slug" ]] || die "missing demo slug"

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_ROOT="$(cd "${SCRIPTS_DIR}/.." && pwd)"
src_dir="${TUTORIALS_DIR}/${slug}"
src="$(resolve_video "$src_dir" "$video_name")"

[[ -n "$src" ]] || die "no video in ${src_dir} (${video_name}.mp4 or ${video_name}-opt.mp4)"

if [[ -z "$out_path" ]]; then
  out_path="${FRONTEND_ROOT}/public/static/img/lab/${slug}/preview.jpeg"
fi

mkdir -p "$(dirname "$out_path")"

vf="crop=min(iw\\,ih):min(iw\\,ih):(iw-min(iw\\,ih))/2:(ih-min(iw\\,ih))/2,scale=${PREVIEW_SIZE}:${PREVIEW_SIZE}"

if [[ -n "$frame_arg" ]]; then
  [[ "$frame_arg" =~ ^[0-9]+$ ]] || die "frame must be a non-negative integer"
  ffmpeg -y -nostdin -hide_banner -loglevel warning -stats \
    -i "$src" \
    -vf "select=eq(n\\,${frame_arg}),${vf}" \
    -frames:v 1 \
    -update 1 \
    -q:v 2 \
    "$out_path"
elif [[ -n "$time_arg" ]]; then
  seek="$(parse_time_to_seconds "$time_arg")"
  ffmpeg -y -nostdin -hide_banner -loglevel warning -stats \
    -ss "$seek" \
    -i "$src" \
    -frames:v 1 \
    -update 1 \
    -vf "$vf" \
    -q:v 2 \
    "$out_path"
else
  mid="$(video_duration "$src" | awk '{ printf "%.3f", $1 / 2 }')"
  ffmpeg -y -nostdin -hide_banner -loglevel warning -stats \
    -ss "$mid" \
    -i "$src" \
    -frames:v 1 \
    -update 1 \
    -vf "$vf" \
    -q:v 2 \
    "$out_path"
fi

echo "$out_path"
