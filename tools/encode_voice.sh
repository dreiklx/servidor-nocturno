#!/usr/bin/env bash
# Convierte voice_src/*.wav (Qwen) en assets/voice/*.mp3 para el juego.
# Recorta silencios, sube un poco el tempo (1.12x, claro pero ágil), normaliza a -16 LUFS y comprime a MP3 mono 56 kbps.
# Uso: bash tools/encode_voice.sh   (requiere ffmpeg en el PATH o en FFMPEG)
set -euo pipefail
cd "$(dirname "$0")/.."
FF="${FFMPEG:-ffmpeg}"
mkdir -p assets/voice
n=0
for w in voice_src/*.wav; do
  b=$(basename "$w" .wav)
  out="assets/voice/$b.mp3"
  [ -f "$out" ] && [ "$out" -nt "$w" ] && continue
  "$FF" -v error -y -i "$w" -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,atempo=1.12,loudnorm=I=-16:TP=-1.5:LRA=11" -ac 1 -ar 24000 -b:a 56k "$out"
  n=$((n+1))
done
echo "MP3 nuevos: $n · total: $(ls assets/voice/*.mp3 2>/dev/null | wc -l)"
