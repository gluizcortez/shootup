# Geração da trilha

As faixas em `public/music` (tema Miami anos 80 neon) foram geradas com o [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5) (licença MIT), modelo turbo, sem o LM, a partir das descrições e seeds de `jobs_miami.json` (as escolhidas também ficam em `src/game/data/music.ts`).

1. Instale o ACE-Step 1.5 e baixe os pesos (`ACE-Step/Ace-Step1.5`, sem o `acestep-5Hz-lm-*`). Em CPU, use bf16 (fp32 estoura 16 GB de RAM).
2. Dentro da pasta do ACE-Step: `python gen.py jobs_miami.json .` gera os WAVs em `out/<id>/`.
3. `python loop.py out/<id>/arquivo.wav <bpm> [início_mín] [fim_máx]` acha um loop alinhado em compassos.
4. `python bake.py out/<id>/arquivo.wav <início> <fim> public/music/<faixa>.mp3` normaliza o volume e assa o loop com crossfade na emenda; em `music.ts`, `loop` vira `[0, duração impressa]`.

Escolhidas: `m_menu_b` → menu (5,34–34,23 s), `m_arena_a` → arena (23,00–57,84 s; o começo era lento), `m_chefe_b` → chefe (6,60–38,60 s).
