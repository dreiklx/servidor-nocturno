"""QA de la narración: transcribe assets/voice/*.mp3 con faster-whisper y compara con el guion.
Uso (venv de Story Lab): C:/Users/dfarl/story-lab/tools/audio/.venv/Scripts/python.exe -I tools/check_voice.py <lines.json>
Imprime el WER por línea y marca las que superan 15 % (candidatas a regenerar)."""
import json
import os
import subprocess
import re
import sys
import unicodedata
from pathlib import Path

import truststore

truststore.inject_into_ssl()
from faster_whisper import WhisperModel  # noqa: E402
import numpy as np  # noqa: E402

FF = os.environ.get('FFMPEG', 'ffmpeg')


def load(path):  # decodifica con ffmpeg a 16 kHz mono float32
    raw = subprocess.run([FF, '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)

root = Path(__file__).resolve().parents[1]
lines = {l["id"]: l["text"] for l in json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))["lines"]}


def norm(t):
    t = unicodedata.normalize("NFD", t.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9ñ ]", " ", t).split()


def wer(ref, hyp):
    d = list(range(len(hyp) + 1))
    for i, r in enumerate(ref, 1):
        prev, d[0] = d[0], i
        for j, h in enumerate(hyp, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (r != h))
    return d[-1] / max(1, len(ref))


model = WhisperModel("small", device="cpu", compute_type="int8")
tot, bad = [], []
for mp3 in sorted((root / "assets" / "voice").glob("*.mp3")):
    if mp3.stem not in lines:
        continue
    segs, _ = model.transcribe(load(mp3), language="es", beam_size=5)
    hyp = " ".join(s.text for s in segs)
    w = wer(norm(lines[mp3.stem]), norm(hyp))
    tot.append(w)
    if w > 0.15:
        bad.append(mp3.stem)
        print(f"! {mp3.stem} WER {w:.0%} :: {hyp[:160]}", flush=True)
print(f"líneas {len(tot)} · WER medio {sum(tot) / max(1, len(tot)):.1%} · sobre 15 %: {len(bad)} {' '.join(bad)}")
