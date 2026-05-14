#!/usr/bin/env bash
# Encode <base>_16x9.mp4 and <base>_9x16.mp4 into *_opt variants (originals untouched).
# Sources may be _<base>_16x9.mp4 / _<base>_9x16.mp4; outputs never use leading underscore.
set -euo pipefail

CRF_H264="${CRF_H264:-28}"
CRF_HEVC="${CRF_HEVC:-32}"

usage() {
  echo "Usage: $(basename "$0") <base-name|all> [videos-dir]" >&2
  echo "Example: $(basename "$0") timeless frontend/public/static/videos" >&2
  echo "Example: $(basename "$0") all frontend/public/static/videos" >&2
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

# Strip optional leading '_' from source basename; parse project base from *_16x9.mp4 / *_9x16.mp4.
base_from_source_name() {
  local name="$1"
  [[ "$name" == _* ]] && name="${name#_}"
  if [[ "$name" == *_16x9.mp4 ]]; then
    printf '%s\n' "${name%_16x9.mp4}"
  elif [[ "$name" == *_9x16.mp4 ]]; then
    printf '%s\n' "${name%_9x16.mp4}"
  else
    return 1
  fi
}

collect_bases() {
  local dir="$1"
  local f name base
  shopt -s nullglob
  for f in "$dir"/*_16x9.mp4 "$dir"/*_9x16.mp4; do
    [[ -f "$f" ]] || continue
    name="${f##*/}"
    [[ "$name" == *_opt* ]] && continue
    base="$(base_from_source_name "$name")" || continue
    printf '%s\n' "$base"
  done | sort -u
}

# Prefer _<base>_<aspect>.mp4 (master), else <base>_<aspect>.mp4.
resolve_src() {
  local dir="$1"
  local base="$2"
  local aspect="$3"
  local pref="${dir}/_${base}_${aspect}.mp4"
  local plain="${dir}/${base}_${aspect}.mp4"
  if [[ -f "$pref" ]]; then printf '%s\n' "$pref"
  elif [[ -f "$plain" ]]; then printf '%s\n' "$plain"
  fi
}

optimize_base() {
  local DIR="$1"
  local BASE="$2"

  local IN169 IN916
  IN916="$(resolve_src "$DIR" "$BASE" "9x16")"
  IN169="$(resolve_src "$DIR" "$BASE" "16x9")"

  if [[ -z "$IN169" ]] && [[ -z "$IN916" ]]; then
    echo "missing both sources for base ${BASE} (${DIR}/_${BASE}_16x9.mp4 or ${DIR}/${BASE}_16x9.mp4, same for 9x16)" >&2
    return 1
  fi

  mkdir -p "$DIR"

  VF_169_HD='scale=1920:-2'
  VF_169_1024='scale=1024:-2'
  VF_916_HD='scale=-2:1920'
  VF_916_1024='scale=1024:-2'

  if [[ -n "$IN169" ]]; then
    encode_h264 "$IN169" "$VF_169_HD" "${DIR}/${BASE}_16x9_opt.mp4"
    encode_hevc "$IN169" "$VF_169_HD" "${DIR}/${BASE}_16x9_opt.hevc.mp4"
    encode_h264 "$IN169" "$VF_169_1024" "${DIR}/${BASE}_16x9_1024x_opt.mp4"
    encode_hevc "$IN169" "$VF_169_1024" "${DIR}/${BASE}_16x9_1024x_opt.hevc.mp4"
  fi

  if [[ -n "$IN916" ]]; then
    encode_h264 "$IN916" "$VF_916_HD" "${DIR}/${BASE}_9x16_opt.mp4"
    encode_hevc "$IN916" "$VF_916_HD" "${DIR}/${BASE}_9x16_opt.hevc.mp4"
    encode_h264 "$IN916" "$VF_916_1024" "${DIR}/${BASE}_9x16_1024x_opt.mp4"
    encode_hevc "$IN916" "$VF_916_1024" "${DIR}/${BASE}_9x16_1024x_opt.hevc.mp4"
  fi
}

if [[ $# -lt 1 ]] || [[ $# -gt 2 ]]; then usage
  exit 1
fi

BASE="$1"
DIR="${2:-frontend/public/static/videos}"

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPTS_DIR}/../.." && pwd)"
if [[ "$DIR" != /* ]]; then
  DIR="${REPO_ROOT}/${DIR}"
fi

if [[ "$BASE" == all ]]; then
  bases="$(collect_bases "$DIR")"
  if [[ -z "$bases" ]]; then
    echo "no source *_16x9.mp4 / *_9x16.mp4 found in ${DIR} (excluding *_opt*)" >&2
    exit 1
  fi
  while IFS= read -r BASE; do
    [[ -z "$BASE" ]] && continue
    echo "=== ${BASE} ==="
    optimize_base "$DIR" "$BASE"
  done <<< "$bases"
  exit 0
fi

optimize_base "$DIR" "$BASE"
