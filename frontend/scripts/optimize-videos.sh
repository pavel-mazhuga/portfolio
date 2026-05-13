#!/usr/bin/env bash
# Encode <base>_16x9.mp4 and <base>_9x16.mp4 into *_opt variants (originals untouched).
set -euo pipefail

CRF_H264="${CRF_H264:-20}"
CRF_HEVC="${CRF_HEVC:-24}"

usage() {
  echo "Usage: $(basename "$0") <base-name> [videos-dir]" >&2
  echo "Example: $(basename "$0") timeless frontend/public/static/videos" >&2
}

audio_map_args() {
  local src="$1"
  local cnt
  cnt="$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$src" 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "$cnt" != "0" ]]; then
    echo -map '0:v:0' -map '0:a:0' -c:a aac -b:a 128k
  else
    echo -map '0:v:0' -an
  fi
}

encode_h264() {
  local src="$1"
  local vf="$2"
  local dst="$3"
  # shellcheck disable=SC2046
  ffmpeg -y -nostdin -hide_banner -loglevel warning -stats \
    -i "$src" \
    $(audio_map_args "$src") \
    -metadata comment="portfolio web export" \
    -c:v libx264 \
    -pix_fmt yuv420p \
    -crf "${CRF_H264}" \
    -vf "${vf}" \
    -movflags +faststart \
    "$dst"
}

encode_hevc() {
  local src="$1"
  local vf="$2"
  local dst="$3"
  # shellcheck disable=SC2046
  ffmpeg -y -nostdin -hide_banner -loglevel warning -stats \
    -i "$src" \
    $(audio_map_args "$src") \
    -metadata comment="portfolio web export" \
    -c:v libx265 \
    -tag:v hvc1 \
    -pix_fmt yuv420p \
    -crf "${CRF_HEVC}" \
    -preset medium \
    -vf "${vf}" \
    -movflags +faststart \
    "$dst"
}

if [[ $# -lt 1 ]] || [[ $# -gt 2 ]]; then usage
  exit 1
fi

BASE="$1"
DIR="${2:-frontend/public/static/videos}"

IN169="${DIR}/${BASE}_16x9.mp4"
IN916="${DIR}/${BASE}_9x16.mp4"

if [[ ! -f "$IN169" ]] && [[ ! -f "$IN916" ]]; then
  echo "missing both: ${IN169} and ${IN916}" >&2
  exit 1
fi

mkdir -p "$DIR"

VF_169_HD='scale=1920:-2'
VF_169_1024='scale=1024:-2'
VF_916_HD='scale=-2:1920'
VF_916_1024='scale=1024:-2'

if [[ -f "$IN169" ]]; then
  encode_h264 "$IN169" "$VF_169_HD" "${DIR}/${BASE}_16x9_opt.mp4"
  encode_hevc "$IN169" "$VF_169_HD" "${DIR}/${BASE}_16x9_opt.hevc.mp4"
  encode_h264 "$IN169" "$VF_169_1024" "${DIR}/${BASE}_16x9_1024x_opt.mp4"
  encode_hevc "$IN169" "$VF_169_1024" "${DIR}/${BASE}_16x9_1024x_opt.hevc.mp4"
fi

if [[ -f "$IN916" ]]; then
  encode_h264 "$IN916" "$VF_916_HD" "${DIR}/${BASE}_9x16_opt.mp4"
  encode_hevc "$IN916" "$VF_916_HD" "${DIR}/${BASE}_9x16_opt.hevc.mp4"
  encode_h264 "$IN916" "$VF_916_1024" "${DIR}/${BASE}_9x16_1024x_opt.mp4"
  encode_hevc "$IN916" "$VF_916_1024" "${DIR}/${BASE}_9x16_1024x_opt.hevc.mp4"
fi
