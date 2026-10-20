"""Gera as falas do Tony Mantega (public/voice/toni_*.mp3).

Voz sintetizada com Kokoro TTS (Apache-2.0) via kokoro-onnx, misturando uma
voz masculina americana com uma espanhola e escrevendo a pronúncia em
fonemas para forçar o sotaque de gângster cubano exagerado. Depois o ffmpeg
dá rouquidão, peito e um eco curto.

    python3 -m venv venv && venv/bin/pip install kokoro-onnx soundfile
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
    venv/bin/python tools/voice/gen_toni.py
"""
import subprocess
import soundfile as sf
from kokoro_onnx import Kokoro

# Fonemas no formato do Kokoro (A=eɪ, I=aɪ, O=oʊ). "th" vira t/d, i curto
# vira "ii", r batido: "de only ting in dis world dat gives orders".
LINES = {
    "appear": "də ˈOnli ˈtiŋ in dis ˈwɔɾl, dat ˈɡivz ˈɔɾdəɾz… iz ʃˈuːts!",
    "rage": "sA ˈhɛlO tu mI ˈlitəl ˈfɾɛn!",
    "death": "sA ɡʊdˈnIt tu də bæd ˈɡI!",
}
FILTER = (
    "asetrate=24000*0.95,aresample=44100,highpass=f=90,"
    "equalizer=f=220:t=q:w=1:g=3,equalizer=f=2300:t=q:w=1.2:g=4,"
    "acompressor=threshold=-20dB:ratio=4:attack=5:release=80,"
    "volume=7dB,asoftclip=type=atan,volume=-5dB,aecho=0.85:0.5:45:0.12,"
    "silenceremove=start_periods=1:start_threshold=-50dB,loudnorm=I=-14:TP=-1.5"
)

k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
style = k.get_voice_style("am_michael") * 0.6 + k.get_voice_style("em_alex") * 0.4
for name, phonemes in LINES.items():
    audio, sr = k.create(phonemes, voice=style, speed=0.88, is_phonemes=True)
    sf.write(f"/tmp/toni_{name}.wav", audio, sr)
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", f"/tmp/toni_{name}.wav", "-af", FILTER,
         "-ac", "1", "-b:a", "96k", f"public/voice/toni_{name}.mp3"],
        check=True,
    )
