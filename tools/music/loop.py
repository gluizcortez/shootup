"""Acha um loop alinhado em compassos: fase da batida pelo envelope de ataques,
fim escolhido pela semelhança espectral com o começo. Uso: loop.py arquivo.wav bpm"""
import sys, wave, numpy as np
path, bpm = sys.argv[1], float(sys.argv[2])
w = wave.open(path); sr = w.getframerate(); ch = w.getnchannels(); sw = w.getsampwidth()
raw = np.frombuffer(w.readframes(w.getnframes()), dtype={2: np.int16, 4: np.int32}[sw]).astype(np.float32)
x = raw.reshape(-1, ch).mean(1); x /= np.abs(x).max() + 1e-9
hop = 512; n = len(x) // hop
frames = np.lib.stride_tricks.sliding_window_view(x, 2048)[::hop][:n - 4]
spec = np.abs(np.fft.rfft(frames * np.hanning(2048), axis=1))
logs = np.log1p(spec)
flux = np.maximum(0, np.diff(logs, axis=0)).sum(1); flux = np.r_[0, flux]
fps = sr / hop; beat = 60 / bpm; bar = 4 * beat
# fase: offset em [0, bar) que maximiza ataques nos tempos
best = max(np.arange(0, bar, 0.005), key=lambda o: sum(flux[int((o + k * beat) * fps)] for k in range(int((len(flux) / fps - o) / beat) - 1)))
dur = len(x) / sr
start = best
while start < 0.2: start += bar  # pula o ataque inicial cortado
bands = np.array_split(logs, 24, axis=1); feat = np.stack([b.mean(1) for b in bands], 1)
def win(t, L=1.0):
    i = int(t * fps); return feat[i:i + int(L * fps)].ravel()
med = np.median([np.sqrt((x[i:i + sr] ** 2).mean()) for i in range(0, len(x) - sr, sr)])
def loud(t0, t1): return np.sqrt((x[int(t0 * sr):int(t1 * sr)] ** 2).mean())
cands = []
for k in range(6):
    st = start + k * bar
    if loud(st, st + 1) < 0.7 * med: continue
    nb = 4
    while st + nb * bar < dur - 1.5:
        e = st + nb * bar
        a, b = win(st), win(e)
        if len(a) == len(b) and loud(e - 1, e) > 0.7 * med:
            cands.append((np.corrcoef(a, b)[0, 1] + 0.01 * nb, nb, e, st))
        nb += 1
score, nbars, end, start = max(cands)
sim = score - 0.01 * nbars
rms_start = np.sqrt((x[int(start*sr):int((start+1)*sr)]**2).mean()); rms_end = np.sqrt((x[int(end*sr)-sr:int(end*sr)]**2).mean())
print(f"{path} dur={dur:.2f} loop=[{start:.4f}, {end:.4f}] bars={nbars} sim={sim:.3f} rms_ini={rms_start:.3f} rms_fim={rms_end:.3f} peak_rms={np.sqrt((x**2).mean()):.3f}")
lag = np.arange(int(fps * 60 / 200), int(fps * 60 / 60))
f = flux - flux.mean(); ac = [np.dot(f[:-l], f[l:]) for l in lag]
print('  bpm estimado ~', round(60 * fps / lag[int(np.argmax(ac))], 1))
