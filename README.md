# ShootUp!

Arena 2D lateral, shoot 'em up roguelite em ondas, com animais cômicos armados.
Este repositório está na **Fase 0** do [GDD](docs/SHOOTUP_GDD.md), com os primeiros itens da Fase 1: um protótipo jogável focado em movimento e tiro, com os 5 animais do MVP (**Pato Pistoleiro**, **Galinha Rambo**, **Vaca Loca**, **Pombo Mafioso** e **Porco Executivo**), o chefe **Don Pombone** na onda 10 e **cartas entre ondas**. O plano técnico está em [docs/PLANO_FASE0.md](docs/PLANO_FASE0.md).

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
| Escolher carta | Clique, ou `1` / `2` / `3` |
| Teste de estresse | `F4` spawna 3 galinhas, 3 patos, 1 vaca, 1 esquadrilha de pombos e 1 porco (só em `npm run dev` ou com `?debug` na URL; a run fica marcada como debug) |
| Chamar o chefe | `F6` chama o Don Pombone na hora (mesmas condições do `F4`) |
| Testar cartas | `F5` abre uma oferta de cartas na hora (mesmas condições do `F4`) |

## Como testar a sensação do jogo

- **Movimento:** acelera e para quase na hora; virar de lado é instantâneo; pulo curto se tocar, longo se segurar; queda mais pesada que a subida; dá para pular logo depois de "sair" do chão (coyote time) e o pulo apertado pouco antes de pousar é lembrado (jump buffer).
- **Pistola:** começa lenta, com 1 tiro a cada 0,6 s (as cartas como Gatilho Nervoso aceleram). Flash na boca, cápsula ejetada que quica, recuo visual do braço, mira que pulsa a cada tiro, hitmarker, número de dano (crítico em âmbar com som próprio), flash branco e empurrão no inimigo, nuvem de penas e acessório voando no abate, hitstop curtinho só no abate.
- **Estrutura de combate (como em Seraph's Last Stand):** você fica no chão e atira para cima. Cada animal é anunciado por uma seta coral piscando no topo, com um assobio, e entra descendo. Os **atiradores nunca vêm até você**: ficam patrulhando no alto, sempre deslocados na horizontal, e atiram para baixo. Só inimigos corpo a corpo (a Vaca Loca) se aproximam do jogador. A sombra no chão mostra a coluna de cada atirador.
- **Pato Pistoleiro:** voa pendurado num cachinho de balões de festa. Antes de cada tiro faz pose dramática com "!" e brilho na pistolinha e acompanha você com a mira; depois dá UM tiro mirado. Ao morrer, os balões sobem sozinhos.
- **Galinha Rambo:** paira mais alto, de jetpack improvisado. O cano começa a girar com zumbido subindo e acompanha você; perto do fim do aviso a mira TRAVA (janela para sair da linha) e sai a rajada naquela direção, empurrando a galinha para trás no ar.
- **Vaca Loca (corpo a corpo):** agora é bípede: cai do topo e corre em duas patas, de braços bombeando. Pisa forte três vezes de punhos erguidos com "!" (aviso), solta um "muuu" e investe em linha reta, mais rápido do que você corre, levantando poeira. Ela não muda de direção no meio da investida: pule por cima ou suba a rampa. Se passar de você, freia e tenta de novo; se bater na parede, fica tonta com estrelinhas e leva 50% a mais de dano. É o único inimigo que causa dano por contato. Estreia na onda 2.
- **Pombo Mafioso:** de sobretudo, chapéu e óculos escuros, com uma metralhadora dentro do estojo de violino. Entra sempre em esquadrilha de 3 em formação V; o bando muda de direção junto e, depois de um assobio (aviso), solta salvas curtas ao mesmo tempo. Se o líder cai, outro assume. Estreia na onda 4.
- **Porco Executivo:** terno apertado com botões estourando, cartola com hélice e maleta. Joga leques de 3 moedas girando e, com o celular tocando, convoca uma "REUNIÃO URGENTE!": dá um escudo dourado (seguro corporativo) aos colegas mais próximos, que absorve dano antes da vida. Mate o porco primeiro. Morre em chuva de dinheiro de mentirinha. Estreia na onda 7.
- **Don Pombone (chefe da onda 10):** pombo gigante de sobretudo branco, correntão de ouro, cravo na lapela, palito no bico e metralhadora dourada. Tem barra de vida no topo da tela e anuncia cada ataque batendo as asas: convoca esquadrilhas de pombos, dispara uma rajada em V (flecha de balas apontada para você, com as pontas mais lentas) ou varre a arena com balas vindo do lado oposto ao seu. Abaixo da metade da vida "fica bravo": avisa mais rápido, ataca com menos pausa e solta o V duas vezes.
- **Cartas entre ondas:** ao limpar uma onda o jogo pausa e oferece 3 cartas (sorteadas com a seed da run, pesadas por raridade). Passe o mouse para ver a carta subir, inclinar e brilhar; escolha com clique ou `1`/`2`/`3`. As cartas pegas aparecem no canto inferior direito.

  | Carta | Efeito | Máx. |
  |---|---|---|
  | Tiro Duplo | +1 bala por disparo, mais aberto, 80% do dano por bala | 3 |
  | Gatilho Nervoso | atira 25% mais rápido | 4 |
  | Bala Viajante | atravessa +1 inimigo e voa 12% mais rápido | 2 |
  | Sinuca Mortal | ao acertar, quica para o inimigo mais próximo | 2 |
  | Mira Cirúrgica | +12% de crítico e críticos +50% mais fortes | 3 |
  | Pé Leve | corre 15% mais rápido e pula mais alto | 2 |
  | Casco Duro | +1 coração máximo e cura 1 | 3 |

  As cartas são dados em `src/game/data/upgrades.ts`. O cálculo segue sempre a mesma ordem: valor base, depois a soma de todos os bônus fixos, depois o produto de todos os multiplicadores, depois os limites de cada atributo (veja `computeStats` em `src/core/upgrades/upgrades.ts`). Assim a ordem em que as cartas foram pegas não muda o resultado.
- **Relevo:** o chão tem platôs altos colados às paredes, rampas e morrinhos nos cantos (centro plano). Dá para subir andando, esquivar descendo a ladeira e pular mais alto lá de cima. A forma está em `TERRAIN` (`src/game/data/arena.ts`).
- **Balas:** pistola a 880 px/s, Pato a 290 px/s e Galinha a 330 px/s, para dar tempo de ler e desviar.
- **Cenário:** estúdio visto da plateia, com a metade de cima livre (treliça de luzes no topo, de onde os animais caem) e o logo apagado no fundo para não competir com os inimigos.
- **Ondas:** a 1 só tem patos, a vaca estreia na 2, a galinha na 3, os pombos na 4 e o porco na 7; a onda 10 é do Don Pombone. Depois dela o jogo continua escalando sozinho. Combo multiplica pontos e anima a plateia.
- **Opções (Esc):** tremor de tela, flashes, números de dano, quantidade de partículas e volume. `prefers-reduced-motion` liga um padrão mais calmo.

## Arquitetura

```text
src/
  core/      lógica pura (sem Phaser/DOM): física, armas, projéteis, IA, colisão, score, ondas, cartas, World
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

## Estado

Feito: arena 16:9 adaptável, personagem provisório, movimento/pulo/mira/tiro manual, pistola, colisões (com teste varrido para projéteis rápidos), vida com i-frames, morte em câmera lenta, resumo da run e reinício em um clique, HUD mínimo, pausa e configurações salvas localmente, Pato Pistoleiro, Galinha Rambo, Vaca Loca, Pombo Mafioso, Porco Executivo, chefe Don Pombone, ondas até a 10 e além, 7 cartas entre ondas (com perfuração e ricochete).

Ainda não feito (só quando pedido): árvore de sinergias, shotgun, outros chefes, menu completo, música, Supabase/ranking.

Problemas conhecidos:
- Arte e sons são **placeholders procedurais temporários**, desenhados em código.
- Os números de FPS só foram medidos num Chromium headless com renderização por software (onde o canvas 2× fica em ~5 FPS). Falta medir em hardware real com o `F3`.
- Balanceamento (vida, dano, cadência, velocidades, pesos das cartas) é chute inicial e está todo em `src/game/data/`.
- As cartas ainda não têm arte própria: usam um ícone simples desenhado em SVG.
