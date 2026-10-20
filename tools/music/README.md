# Geração da trilha

As faixas em `public/music` foram geradas com o [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5) (licença MIT), modelo turbo, sem o LM, a partir das descrições e seeds de `jobs.json` (as mesmas ficam em `src/game/data/music.ts`).

1. Instale o ACE-Step 1.5 e baixe os pesos (`ACE-Step/Ace-Step1.5`, sem o `acestep-5Hz-lm-*`). Em CPU, use bf16 para caber em 16 GB de RAM.
2. `python gen.py jobs.json` dentro da pasta do ACE-Step gera os WAVs em `out/<id>/`.
3. `python loop.py out/<id>/arquivo.wav <bpm>` acha um loop alinhado em compassos e imprime `loop=[início, fim]`.
4. Converta com `ffmpeg -i in.wav -t <fim+0.6> -af loudnorm=I=-15:TP=-1.5 -b:a 128k public/music/<faixa>.mp3` e atualize `loop` em `music.ts`.

Escolhidas: `menu_a` → menu, `arena_a` → arena, `chefe_b` → chefe.
