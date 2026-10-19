# ShootUp!

Arena 2D lateral, shoot 'em up roguelite em ondas, com animais cômicos armados.
Este repositório está na **Fase 0** do [GDD](docs/SHOOTUP_GDD.md): um protótipo jogável focado em movimento, tiro e no primeiro combate contra o **Pato Pistoleiro** e a **Galinha Rambo**. O plano técnico está em [docs/PLANO_FASE0.md](docs/PLANO_FASE0.md).

## Como rodar

Requisitos: Node 20.19+ (testado com Node 22) e npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

Outros comandos:

| Comando | O que faz |
|---|---|
| `npm run build` | Typecheck estrito + build de produção em `dist/` |
| `npm run preview` | Serve o build de produção em http://localhost:4173 |
| `npm test` | Testes unitários do core (Vitest) |
| `npm run test:e2e` | Smoke test no navegador (Playwright) sobre o build de produção |

Para o e2e, instale o navegador uma vez com `npx playwright install chromium`, ou aponte para um Chromium existente com `CHROMIUM_PATH=/caminho/do/chrome npm run test:e2e`.

O jogo roda 100% offline: sem backend, sem downloads de assets (a arte e os sons são gerados em código).
Deploy: é um site estático do Vite, então a Vercel detecta sozinha (build `npm run build`, saída `dist`).

## Controles

| Ação | Tecla |
|---|---|
| Mover | `A` / `D` ou setas |
| Pular | `W`, `↑` ou `Espaço` (segure para pular mais alto) |
| Mirar | Mouse |
| Atirar | Botão esquerdo **segurado** |
| Pausar / configurações | `Esc` ou `P` |
| Reiniciar | `R` (na pausa ou no game over), `Enter` no menu |
| Overlay de desempenho | `F3` (FPS, média e P95 do quadro, contagem de entidades) |
| Teste de estresse | `F4` spawna 3 galinhas + 3 patos (só em `npm run dev` ou com `?debug` na URL; a run fica marcada como debug) |

## Como testar a sensação do jogo

- **Movimento:** acelera e para quase na hora; virar de lado é instantâneo; pulo curto se tocar, longo se segurar; queda mais pesada que a subida; dá para pular logo depois de "sair" do chão (coyote time) e o pulo apertado pouco antes de pousar é lembrado (jump buffer).
- **Pistola:** flash na boca, cápsula ejetada que quica, recuo visual do braço, mira que pulsa a cada tiro, hitmarker, número de dano (crítico em âmbar com som próprio), flash branco e empurrão no inimigo, nuvem de penas e acessório voando no abate, hitstop curtinho só no abate.
- **Estrutura de combate (como em Seraph's Last Stand):** você fica no chão e atira para cima. Cada animal é anunciado por uma seta coral piscando no topo, com um assobio, e entra descendo. Os **atiradores nunca vêm até você**: ficam patrulhando no alto, sempre deslocados na horizontal, e atiram para baixo. Só inimigos corpo a corpo (ainda nenhum na Fase 0) se aproximam do jogador. A sombra no chão mostra a coluna de cada atirador.
- **Pato Pistoleiro:** voa pendurado num cachinho de balões de festa. Antes de cada tiro faz pose dramática com "!" e brilho na pistolinha e acompanha você com a mira; depois dá UM tiro mirado. Ao morrer, os balões sobem sozinhos.
- **Galinha Rambo:** paira mais alto, de jetpack improvisado. O cano começa a girar com zumbido subindo e acompanha você; perto do fim do aviso a mira TRAVA (janela para sair da linha) e sai a rajada naquela direção, empurrando a galinha para trás no ar.
- **Relevo:** o chão tem platôs altos colados às paredes, rampas e morrinhos nos cantos (centro plano). Dá para subir andando, esquivar descendo a ladeira e pular mais alto lá de cima. A forma está em `TERRAIN` (`src/game/data/arena.ts`).
- **Balas:** pistola a 880 px/s, Pato a 290 px/s e Galinha a 330 px/s, para dar tempo de ler e desviar.
- **Cenário:** estúdio visto da plateia, com a metade de cima livre (treliça de luzes no topo, de onde os animais caem) e o logo apagado no fundo para não competir com os inimigos.
- **Ondas:** 1–2 só patos, a galinha estreia na 3, depois escala sozinho. Combo multiplica pontos e anima a plateia.
- **Opções (Esc):** tremor de tela, flashes, números de dano, quantidade de partículas e volume. `prefers-reduced-motion` liga um padrão mais calmo.

## Arquitetura

```text
src/
  core/      lógica pura (sem Phaser/DOM): física, armas, projéteis, IA, colisão, score, ondas, World
  game/      Phaser: cenas, arte provisória, views com interpolação, VFX, áudio, input, dados (data-driven)
  ui/        React: HUD, título, pausa, game over, tokens visuais
  shared/    event bus tipado, settings, tipos e métricas de quadro
  app/       bootstrap React + montagem do Phaser
tests/       Vitest do core
e2e/         Playwright (smoke)
```

Decisões principais:
- **Simulação determinística em `core/`**, rodando em **passo fixo de 120 Hz** com RNG por seed. A renderização interpola entre passos, então movimento e cadência de tiro são iguais a 30, 60 ou 144 FPS. A mesma seed com as mesmas entradas reproduz a run, o que ajuda a validar pontuações no futuro.
- **Phaser só desenha.** Projéteis, partículas, textos e inimigos usam pools; nada é alocado por tiro.
- **VFX e áudio reagem a eventos** (`shot`, `enemyHit`, `enemyKilled`…) e não tocam no dano: baixar partículas não muda o jogo.
- **React só para overlays.** O jogo emite um snapshot do HUD apenas quando algum número muda; o contador de pontos anima direto no DOM.
- Armas, inimigos, ondas e física do jogador ficam em `src/game/data/` como dados tipados.

## Estado da Fase 0

Feito: arena 16:9 adaptável, personagem provisório, movimento/pulo/mira/tiro manual, pistola, colisões (com teste varrido para projéteis rápidos), vida com i-frames, morte em câmera lenta, resumo da run e reinício em um clique, HUD mínimo, pausa e configurações salvas localmente, Pato Pistoleiro e Galinha Rambo, ondas simples.

Fora do escopo (próximas fases, só quando pedido): cartas e árvore de upgrades, shotgun, outros animais e chefes, menu completo, música, Supabase/ranking.

Problemas conhecidos:
- Arte e sons são **placeholders procedurais temporários**, desenhados em código.
- Os números de FPS só foram medidos num Chromium headless com renderização por software (onde o canvas 2× fica em ~5 FPS). Falta medir em hardware real com o `F3`.
- Balanceamento (vida, dano, cadência, velocidades) é chute inicial e está todo em `src/game/data/`.
