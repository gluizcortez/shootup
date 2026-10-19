# ShootUp! — Plano técnico da Fase 0

Escopo: apenas a **Fase 0** do GDD (§11). Arena lateral 16:9, personagem provisório, movimento/pulo/mira/disparo, pistola, colisões, vida, morte e reinício. Como inimigos iniciais: **Pato Pistoleiro** e **Galinha Rambo** (recomendação do Cortez). Sem cartas, árvore, Supabase, menus elaborados ou outras armas.

## Decisões técnicas

| Tema | Decisão | Motivo |
|---|---|---|
| Stack | TypeScript estrito + Vite + React 19 + Phaser 3.90 (fixado) + Vitest | Phaser 3.90 é a última linha 3.x, madura e bem documentada; migrar para Phaser 4 depois é localizado na camada `game/`. |
| Simulação | Toda a lógica de jogo (física do jogador, armas, IA, projéteis, colisão, dano, score) roda em `core/`, **TypeScript puro, sem Phaser** | Testável em Node, determinística com RNG com seed, e no futuro permite revalidar runs (ajuda o anti-cheat do ranking). |
| Loop | **Passo fixo de 120 Hz** com acumulador + interpolação na renderização | Movimento e cadência de tiro iguais a 30, 60 ou 144 FPS (critério da Fase 0). |
| Física | Cinemática própria (AABB vs. chão/paredes, círculos para projéteis), sem Arcade Physics | Controle fino de game feel: aceleração/desaceleração, controle aéreo, *coyote time*, *jump buffer*, pulo variável, gravidade maior na queda. |
| Renderização | Phaser só desenha: texturas procedurais geradas no Boot (placeholders explícitos), sprites em **pools** | Sem alocação por tiro; 100+ projéteis sem GC. |
| VFX / áudio | Sistemas que **consomem eventos** da simulação (`shot`, `hit`, `kill`, `playerHurt`…) | VFX separado do dano: reduzir partículas não muda a jogabilidade. SFX sintetizados via WebAudio = 100% originais. |
| UI | React só para overlays (título, HUD, pausa, game over). Ponte via **event bus tipado** + store com `useSyncExternalStore`; HUD recebe snapshot só quando algo muda | React nunca rerenderiza por projétil ou por tick. |
| Settings | `localStorage` (screen shake, flashes, volume), padrão respeita `prefers-reduced-motion` | GDD §8/§12. |

## Game feel da pistola e do personagem
- Muzzle flash, cápsula ejetada com física simples, recuo visual do braço, tracer curto, leve *spread*, *pitch variation* no som.
- Impacto: flash branco no inimigo, knockback, número de dano, crítico com som/cor próprios, *hitstop* curto só no abate, nuvem de penas na morte.
- Screen shake proporcional e limitado, desligável.
- Personagem: *squash & stretch* no pulo/aterrissagem, poeira, corpo e arma virados para a mira; i-frames piscando ao levar dano.

## Inimigos
- **Pato Pistoleiro:** aproxima em saltinhos, para numa distância, faz pose dramática (telegraph) e dá um tiro único mirado.
- **Galinha Rambo:** mantém distância, cano gira (telegraph), rajada horizontal; o recuo a empurra para trás.
- Tiros inimigos em coral, maiores e com contorno; tiros do jogador em âmbar/turquesa, finos.
- Ondas simples e crescentes só para dar ritmo ao teste (sem cartas entre ondas).

## Estrutura de pastas
```text
src/
  app/            main.tsx, App.tsx, GameHost.tsx (monta Phaser dentro do React)
  core/           lógica pura, sem Phaser nem DOM
    math/         vetores, RNG com seed
    physics/      movimento do jogador, colisão AABB/círculo
    combat/       armas, projéteis (pool), dano/crítico
    enemies/      IA do Pato Pistoleiro e da Galinha Rambo (máquinas de estado)
    scoring/      score e combo
    run/          World (passo da simulação), ondas, estados MENU/PLAYING/PAUSED/GAME_OVER
  game/           Phaser
    data/         definições data-driven: armas, inimigos, ondas, física do jogador
    scenes/       BootScene (gera texturas), ArenaScene
    rendering/    texturas procedurais (temporárias), pools de sprites, views
    systems/      FixedStepper, input, VFX, áudio
  ui/
    components/   HUD, contadores
    screens/      Título, Pausa, Game Over
    theme/        tokens CSS (paleta do GDD)
  shared/         event bus tipado, tipos comuns, settings
tests/            Vitest (core) + smoke Playwright
docs/             GDD e este plano
```
`infra/` e `supabase/` só entram na Fase 2.

## Etapas
1. Scaffold Vite + React + Phaser + Vitest, TS estrito.
2. Core: física do jogador, arma, projéteis, colisão, com testes.
3. Phaser: arena, jogador, mira, pistola com todo o feedback.
4. Pato Pistoleiro, depois Galinha Rambo, ondas simples.
5. HUD mínimo, pausa (Esc), morte e reinício (R).
6. `npm run build`, `npm test`, smoke no navegador e instruções.
