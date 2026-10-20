"""Assa um loop sem emenda: recorta [início, fim] e mistura os X s depois do fim
por cima do começo (crossfade de potência igual). O arquivo inteiro vira o loop.
Uso: bake.py entrada.wav início fim saída.mp3 [X=0.5]"""
import sys, subprocess, wave, numpy as np, tempfile, os
src, st, en, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
X = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
tmp = tempfile.mkdtemp()
norm = os.path.join(tmp, 'n.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-ar', '44100', norm], check=True)
w = wave.open(norm); sr = w.getframerate(); ch = w.getnchannels()
x = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, ch).astype(np.float32)
a, b, n = int(st * sr), int(en * sr), int(X * sr)
seg = x[a:b].copy()
t = np.linspace(0, np.pi / 2, n)[:, None]
seg[:n] = seg[:n] * np.sin(t) + x[b:b + n] * np.cos(t)
o = wave.open(os.path.join(tmp, 'l.wav'), 'wb'); o.setnchannels(ch); o.setsampwidth(2); o.setframerate(sr)
o.writeframes(np.clip(seg, -32768, 32767).astype(np.int16).tobytes()); o.close()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(tmp, 'l.wav'), '-c:a', 'libmp3lame', '-b:a', '128k', out], check=True)
print(out, 'dur', round(len(seg) / sr, 4))
