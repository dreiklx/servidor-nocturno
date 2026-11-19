"""Sintetiza la narración del juego con Qwen3-TTS (voz fija por clonación), igual que Story Lab.
Se ejecuta con el venv de Story Lab:
  C:/Users/dfarl/story-lab/tools/audio/.venv-qwen/Scripts/python.exe -I tools/synth_qwen.py <lines.json> <carpeta_wav> [ids...]
Las voces de referencia salen de story-lab/voice_test/voices.json (n = narrador, f = Erika).
Después: tools/encode_voice.sh convierte los WAV a MP3 en assets/voice/."""
import json
import os
import sys
from pathlib import Path


import truststore

truststore.inject_into_ssl()

import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

STORY = Path("C:/Users/dfarl/story-lab")
lines_path, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
only = set(sys.argv[3:])
out_dir.mkdir(parents=True, exist_ok=True)
voices = json.loads((STORY / "voice_test" / "voices.json").read_text(encoding="utf-8"))["qwen"]["es"]
lines = json.loads(lines_path.read_text(encoding="utf-8"))["lines"]

model = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-1.7B-Base", device_map="cuda:0", dtype=torch.bfloat16, attn_implementation="sdpa")
for i, ln in enumerate(lines):
    if only and ln["id"] not in only:
        continue
    dest = out_dir / f"{ln['id']}.wav"
    if dest.exists() and not only:
        continue
    v = voices[ln["speaker"]]
    torch.manual_seed(200 + i)
    wavs, sr = model.generate_voice_clone(text=ln["text"], language="Spanish", ref_audio=str(STORY / v["ref"]), ref_text=v["refText"])
    y = np.asarray(wavs[0], dtype=np.float32)
    sf.write(dest, y, sr)
    print(ln["id"], round(len(y) / sr, 2), flush=True)
print("FIN", flush=True)
