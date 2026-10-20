"""Gera as falas do Tony Mantega (public/voice/toni_*.mp3).

Duas etapas, tudo open source rodando em CPU:
1. Kokoro TTS (Apache-2.0, kokoro-onnx) cria uma voz-guia sintética com
   sotaque de gângster cubano exagerado, escrito em fonemas. Não é clone de
   nenhum ator real.
2. Chatterbox TTS (MIT, Resemble AI) fala as frases com a voz-guia como
   referência de timbre e sotaque, com prosódia humana e controle de emoção
   (`exaggeration`). O ffmpeg só normaliza volume e corta silêncio.

    python3 -m venv venv && venv/bin/pip install kokoro-onnx soundfile chatterbox-tts "setuptools<81"
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
    venv/bin/python tools/voice/gen_toni.py

Os takes variam com a semente; ouça e escolha antes de commitar.
"""
import subprocess
import soundfile as sf
import torch
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS
from kokoro_onnx import Kokoro

# Voz-guia (Kokoro, fonemas: A=eɪ, I=aɪ, O=oʊ): "th" vira t/d, i curto vira "ii", r batido.
GUIDE = [
    "də ˈOnli ˈtiŋ in dis ˈwɔɾl, dat ˈɡivz ˈɔɾdəɾz… iz ʃˈuːts!",
    "sA ˈhɛlO tu mI ˈlitəl ˈfɾɛn!",
    "sA ɡʊdˈnIt tu də bæd ˈɡI!",
]
# Falas finais (texto grafado com sotaque) e intensidade da emoção.
LINES = {
    "appear": ("De only ting in dis world dat gives orders... is shoots!", 0.7),
    "rage": ("Say hello to my leetle friend!", 1.2),
    "death": ("Say goodnight to de bad guy!", 0.9),
}
FILTER = (
    "highpass=f=70,equalizer=f=200:t=q:w=1:g=2,"
    "acompressor=threshold=-18dB:ratio=3:attack=5:release=100,"
    "silenceremove=start_periods=1:start_threshold=-50dB,areverse,"
    "silenceremove=start_periods=1:start_threshold=-50dB,areverse,"
    "loudnorm=I=-14:TP=-1.5"
)

k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
style = k.get_voice_style("am_michael") * 0.6 + k.get_voice_style("em_alex") * 0.4
guide = []
for phonemes in GUIDE:
    audio, sr = k.create(phonemes, voice=style, speed=0.88, is_phonemes=True)
    guide.append(audio)
import numpy as np  # noqa: E402

sf.write("/tmp/toni_guide.wav", np.concatenate(guide), sr)

tts = ChatterboxTTS.from_pretrained(device="cpu")
for name, (text, exaggeration) in LINES.items():
    torch.manual_seed(1)
    wav = tts.generate(text, audio_prompt_path="/tmp/toni_guide.wav", exaggeration=exaggeration,
                       cfg_weight=0.35, temperature=0.8)
    ta.save(f"/tmp/toni_{name}.wav", wav, tts.sr)
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", f"/tmp/toni_{name}.wav", "-af", FILTER,
         "-ar", "44100", "-ac", "1", "-b:a", "112k", f"public/voice/toni_{name}.mp3"],
        check=True,
    )
