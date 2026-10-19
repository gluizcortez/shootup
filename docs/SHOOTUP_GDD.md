# SHOOTUP! — Game Design Document (GDD)

**Versão:** 0.1 — Documento inicial para desenvolvimento com Claude Code  
**Status:** Conceito aprovado; especificações propostas, ajustáveis durante o protótipo  
**Gênero:** Arcade shoot 'em up 2D de arena fixa + roguelite de ondas  
**Plataforma inicial:** Web (desktop), deploy Vercel, autenticação e rankings Supabase  
**Plataforma futura (TBD):** Desktop/Steam via Tauri, com persistência SQL adequada à versão desktop

> **Pitch:** Você é o competidor de um programa de TV completamente insano em que uma multidão de animais cartunescos — galinhas com metralhadoras, patos pistoleiros, vacas descontroladas, porcos de terno e pombos mafiosos — tenta eliminá-lo. A cada onda, escolha melhorias de uma árvore roguelite e transforme armas de fogo comuns em máquinas absurdas de ricochetes, fragmentos, explosões e combos.

---

## 1. Visão criativa e pilares

**Nome:** ShootUp!  
**Conceito temático:** *The World's Worst Show* — um programa de auditório clandestino, absurdo e colorido. Seu apresentador nunca é mostrado por completo no início: ouvimos a voz, vemos o placar, as luzes do estúdio e os avisos de patrocinadores fictícios. Os **inimigos são sempre animais cômicos**, não alienígenas, robôs genéricos ou hordas humanas. Alguns usam roupas, acessórios e armas de maneira deliberadamente ridícula.

**Referências, sem copiá-las:**
- **Seraph's Last Stand:** arena lateral de tela única, movimentação e disparo manual, ondas curtas, escolha de upgrade após cada onda e builds que escalam intensamente.
- **Balatro:** qualidade tátil da UI — hover, inclinação sutil das cartas, animações spring, efeitos holográficos, áudio sincronizado, contadores expressivos e clareza de números; **não copiar** sua identidade visual exata.
- **Arcade pixel art moderno:** leitura instantânea das silhuetas, animações exageradas, partículas e iluminação controlada.

### Cinco pilares inegociáveis
1. **Resposta imediata:** movimentar, pular, mirar e disparar precisam ser precisos e sem latência perceptível.
2. **Humor visual:** inimigos devem provocar risos mesmo antes do jogador conhecer seus ataques.
3. **Escalada espetacular:** uma run começa simples e termina em sinergias explosivas, sem destruir a legibilidade.
4. **Escolhas interessantes:** upgrades alteram comportamento do tiro, e não apenas estatísticas.
5. **Performance:** efeitos intensos com pooling e níveis configuráveis de VFX; preservar fluidez como prioridade.

### Não objetivos do MVP
Multiplayer, narrativa extensa, campanha com exploração, economia complexa, loja de cosméticos, versão mobile como alvo principal, Steam/Tauri, servidor dedicado com simulação autoritativa e centenas de upgrades no primeiro lançamento.

---

## 2. Mecânica central e loop de gameplay

### Perspectiva e controles
- **2D side-view** (visão lateral), câmera fixa em uma arena de tela única; chão contínuo e espaço aéreo para inimigos voadores.
- Movimento horizontal por **A/D** ou setas; **W/espaço** para pular; gravidade e controle aéreo responsivos; mira pelo mouse; **botão esquerdo segurado** para disparar.
- Controles e sensibilidade configuráveis; pausar com **Esc**; suporte inicial obrigatório para mouse/teclado.
- O jogador pode mirar em qualquer direção, com arma e personagem visualmente orientados para a mira. **Não criar um auto-shooter**: o prazer da mira manual faz parte da proposta.
- Decisão de protótipo: começar com arena retangular e solo plano. Plataformas adicionais só entram se melhorarem comprovadamente o combate.

### Ciclo de uma run
1. **Menu:** jogar, selecionar arma desbloqueada, ranking, coleção de melhorias e opções.
2. **Começo da run:** personagem com arma básica, poucos efeitos, primeira onda imediatamente compreensível.
3. **Onda ativa:** inimigos terrestres e voadores entram com sinais visuais; o jogador esquiva, pula, mira, dispara e acumula pontuação/combo.
4. **Fim da onda:** pausa de combate de curta duração, animação de vitória e oferta de **3 cartas de upgrade**, com escolha de 1. A árvore visível indica os ramos e sinergias já adquiridos.
5. **Marcos:** a cada **5 ondas**, um inimigo de elite ou evento especial; a cada **10 ondas**, chefe e escolha de melhoria mais rara (números sujeitos a playtest).
6. **Escalada:** mais inimigos, formações novas, inimigos elite, projéteis e ameaças misturadas. O jogador também escala por upgrades.
7. **Morte:** resumo da run (onda, pontuação, arma, principais cartas e combo máximo), botão de tentar novamente sem fricção e envio opcional ao ranking.

**Ritmo-alvo inicial:** ondas de 20–45 segundos em média. Pausas de escolha devem ser curtas, mas não cronometradas por padrão. O jogo é endless; os primeiros 10 níveis funcionam como uma introdução progressiva.

### Pontuação
- Pontos por inimigo, elite, chefe e conclusão de onda.
- **Combo** por abates próximos no tempo; reinicia/decai sem novos acertos conforme testes. Combo deve intensificar cor, animação e áudio, sem esconder a ação.
- Leaderboards por **onda máxima**, **pontuação** e, futuramente, **desafio semanal com seed compartilhada**. Runs modificadas por debug não entram em rankings.

---

## 3. Universo, humor e linguagem visual

O estúdio é uma versão delirante de um programa de TV dos anos 1990/2000. Telões, banners, refletores, confete, público de silhuetas e propagandas absurdas geram identidade sem interferir na jogabilidade. Narrador usa frases curtas: “PATOS NA ÁREA!”, “AUDIÊNCIA EM ALTA!”, “O RH MANDOU MAIS PORCOS!”. Evitar narrador falando a todo segundo.

**Tom:** cartoon pastelão, paródia, expressões exageradas e violência *slapstick* **sem gore realista**. O inimigo derrotado desaparece numa nuvem de penas, estrelas, papéis, queijos, moedas fictícias ou confete conforme sua espécie. A comédia está na animação e no comportamento, não em grandes caixas de texto.

**Regra de silhueta:** o jogador identifica a família de inimigo pela forma, postura, cor e movimento em menos de um segundo. Armas inimigas têm brilho/telegraph diferente dos tiros do jogador.

---

## 4. Bestiário: animais inimigos

Os animais devem parecer genuinamente engraçados, carismáticos e um pouco ameaçadores. **Cada família tem função tática própria**. A lista abaixo é uma proposta de catálogo; o MVP implementa apenas parte dela.

| Inimigo | Visual / piada | Padrão de combate | Papel |
|---|---|---|---|
| **Galinha Rambo** | Galinha musculosa de bandana, óculos e metralhadora desproporcional | Rajadas horizontais com aviso de cano girando; recuo a faz andar para trás | Supressão à distância |
| **Pato Pistoleiro** | Pato de chapéu de cowboy e minúscula pistola | Aproxima em saltinhos e dispara tiros individuais anunciados por pose dramática | Atirador básico |
| **Vaca Loca** | Vaca de olhos arregalados com sino gigante e sorriso assustador | Bate casco e investe correndo em linha reta; fica tonta ao bater na parede | Investida terrestre |
| **Porco Executivo** | Porco de terno apertado, gravata e pasta de couro | Atira moedas/papéis cortantes e invoca bônus para aliados próximos | Suporte e buffer |
| **Pombo Mafioso** | Pombo de sobretudo e óculos escuros; anda em bando | Voo rasteiro em esquadrilha, salvas rápidas e mudanças de direção sincronizadas | Pressão aérea |
| **Cãot Siamês** | Cão e gato unidos de forma cartunesca, brigando entre si | Anda em zigue-zague; lado gato ataca de perto, lado cão lança projétil | Inimigo híbrido imprevisível |
| **Ganso Fiscal** | Ganso engravatado e carregando prancheta | Avança buzinando e cria pequena zona de desaceleração por curto período | Controle de espaço |
| **Coelho Cafeinado** | Coelho com olheiras, energético e tênis de corrida | Sequência rápida de saltos com pausas vulneráveis | Flanqueador veloz |
| **Lhama Nervosa** | Lhama com topete e expressão de desdém | Projéteis em arco com trajetória colorida bem visível | Artilharia em arco |
| **Tartaruga Tanque** | Tartaruga com capacete e casco reforçado | Lenta, frente blindada, abre a guarda após atacar | Tanque |
| **Macaco do Caos** | Macaco com colete de show e mochila de bananas | Arremessa bananas explosivas com fusível cômico | Armadilhas em área |
| **Sapo DJ** | Sapo de headset e jaqueta brilhante | Ondas rítmicas no chão e projéteis pulsados no tempo da música | Padrão rítmico |
| **Guaxinim Ladrão** | Guaxinim com mochila roubada e máscara natural | Rouba temporariamente pickups que estão no chão e foge | Inimigo oportunista |
| **Coruja Contadora** | Coruja com óculos gigantes e calculadora | Voa alto e marca uma área que receberá disparo retardado | Zona de perigo |
| **Jacaré Segurança** | Jacaré enorme de terno de segurança e rádio | Avança protegendo inimigos menores e bloqueando tiros frontais | Protetor |
| **Capivara Indiferente** | Capivara zen com boia e café | Anda serenamente ignorando o caos; aura de resistência para animais próximos | Suporte de resistência |

### Inimigos elite (variações com leitura clara)
- **Galinha Rambo Dourada:** rajadas em leque, recarga longa e muito telegráfica.
- **Pato Xerife:** projétil que ricocheteia **uma vez** no chão.
- **Pombo Don:** escoltado por 2 pombos menores; ataque coordenado.
- **Vaca Turbo:** investida dupla antes de ficar vulnerável.
- **Porco CEO:** escudo temporário para empregados animais próximos; animação de “reunião urgente”.

### Chefes e personalidade
1. **Don Pombone — O Poderoso Pombo** (onda 10): pombo mafioso gigantesco de sobretudo branco; convoca esquadrilhas, dispara padrões em V e anuncia ataques batendo as asas.
2. **Madame Moo — A Vaca Fora de Controle** (onda 20): vaca com penteado extravagante, salto alto e sino de ouro; alterna corridas destrutivas e pulos que causam onda de choque.
3. **Senhor Bacon — Diretor de Operações** (onda 30): porco de terno, poltrona corporativa voadora e lançador de maletas; “terceiriza” inimigos e cria reuniões-armadilha.
4. **Dupla Cãot-ástrofe** (onda 40): cachorro e gato siameses gigantes; brigam entre si, mudando o padrão de ataque de um lado para outro.
5. **O Apresentador** (revelação futura): uma figura animal misteriosa, com microfone dourado; definir espécie e mecânicas após validar o tom.

**Regra para bosses:** no máximo 3–4 ataques distintos por fase, todos com telegraph nítido e janelas reais de contra-ataque; humor em animações curtas, não em cutscenes longas.

### Progressão de elenco por ondas (proposta)
- **1–3:** Pato Pistoleiro, Vaca Loca (em pequenas quantidades).
- **4–6:** Galinha Rambo, Pombo Mafioso, primeiras formações.
- **7–9:** Porco Executivo e Cãot Siamês, mistura de papéis.
- **10:** Don Pombone.
- **11+ (pós-MVP):** novos animais, elites, variantes e combos de formações.

---

## 5. Personagem e armas de fogo

**Protagonista (provisório):** competidor pequeno, cartunesco, com roupa/ capacete de programa de auditório, braços expressivos e armas exageradas. O design final pode ser humano estilizado ou boneco de ação — **TBD**, sem bloquear o desenvolvimento. **Todas as armas equipadas pelo jogador são armas de fogo**, com munição estilizada/cartunesca; nada de cajados mágicos como arma principal.

| Arma | Identidade | Trade-off | Fantasia de build |
|---|---|---|---|
| **Pistola** | Disparo preciso e versátil | Cadência intermediária | Crítico + ricochete |
| **Revólver** | Tiros impactantes, som marcante | Cadência baixa | Acertos críticos devastadores |
| **Submetralhadora** | Chuva de projéteis | Dispersão e dano por tiro menores | Chance de efeito por acerto |
| **Shotgun** | Múltiplos pellets em cone | Alcance efetivo menor | Fragmentação e explosões em cadeia |
| **Rifle** | Velocidade e perfuração | Precisão exige mira | Perfuração + dano em linha |
| **Metralhadora** | Cadência escalona ao disparar | Mobilidade reduzida durante sustentação (avaliar em teste) | Escala de velocidade e projéteis |
| **Lança-granadas** | Projétil em arco e área | Tiro lento e risco de errar alvo móvel | Explosão + efeitos de área |

**MVP:** pistola e shotgun; desbloqueios e demais armas depois da validação do tiro.

### Sensação das armas (*game feel*)
- Muzzle flash curto e expressivo, cápsula estilizada, som com ataque definido e *pitch variation* discreta.
- Recuo visual da arma (não tirar controle do cursor), câmera com shake proporcional e limitado, hitstop apenas em impactos especiais.
- Feedback por categoria: dano normal, crítico, perfuração, eliminação, explosão e combo têm linguagem audiovisual distinta.
- Projéteis inimigos sempre distinguíveis dos tiros do jogador, mesmo com a tela cheia.

---

## 6. Roguelite: cartas, árvore e sinergias

O jogo tem **dois níveis de progressão bem separados**:
1. **Durante a run:** cartas entre ondas desenvolvem uma árvore de sinergias temporárias. Tudo reinicia na run seguinte.
2. **Metaprogressão (pós-MVP):** desbloqueio de armas, cartas e cosméticos. Evitar bônus permanentes gigantescos que tornem rankings injustos; rankings devem documentar regras e versões.

### Três ramificações da árvore por run

**A. BALÍSTICA — precisão, crítico e trajetória**  
Nós exemplares: Munição Afiada → Perfuração → Perfuração em Série; Mira Fria → Crítico → Crítico que Recarrega; Ricochete → Ricochete Duplo → Busca de Alvo.

**B. CAOS — quantidade, fragmentação e explosões**  
Nós exemplares: Projétil Extra → Multidisparo → Tempestade; Pólvora Instável → Explosões na Morte → Reação em Cadeia; Fragmentação → Miniestilhaços → Estilhaços Explosivos.

**C. SOBREVIVÊNCIA — esquiva, sustentação e controle**  
Nós exemplares: Passo Leve → Mobilidade Aérea → Esquiva Melhorada; Coleta de Vida → Recuperação Condicional; Blindagem Improvisada → Defesa a Curto Prazo.

**Árvore visual:** conexões entre nós, requisitos claros, zoom discreto, tooltips rápidos e ícones fortes. A escolha padrão entre ondas continua sendo **uma entre três cartas**, não abrir uma tela enorme obrigatória para toda melhoria. A árvore completa pode ser acessada no painel de build e na pausa; cartas sinalizam qual ramo avançam.

### Exemplos de cartas de upgrade

| Carta | Raridade proposta | Efeito de design |
|---|---|---|
| Tiro Duplo | Comum | +1 projétil, com ajuste de dano/espalhamento para equilibrar |
| Gatilho Nervoso | Comum | Maior cadência |
| Bala Pesada | Comum | Mais dano, menor velocidade do projétil |
| Cartucho Largo | Comum | Shotgun espalha mais pellets |
| Pé Leve | Comum | Mais velocidade horizontal |
| Casco Duro | Comum | Pequeno aumento de vida/defesa |
| Mira Cirúrgica | Incomum | Maior chance de crítico |
| Bala Viajante | Incomum | Projétil perfura 1 alvo |
| Sinuca Mortal | Incomum | Um ricochete por projétil elegível |
| Pipoca Explosiva | Rara | Inimigos abatidos têm chance de explodir |
| Estilhaços | Rara | Abates geram projéteis secundários de baixo dano |
| Pós-Combustão | Rara | Explosões deixam curta área incendiária estilizada |
| Contágio de Caos | Épica | Explosões podem ativar outra explosão, com limite controlado |
| Chuva de Chumbo | Épica | Incremento significativo de multitiro com trade-off |
| Efeito Dominó | Épica | Abates por projétil perfurante geram disparo adicional |
| Circo de Balas | Lendária | Combina ricochetes e fragmentação em curta sequência limitada |

**Raridades sugeridas:** Comum, Incomum, Rara, Épica, Lendária. As probabilidades finais dependem de teste, não fixar agora.

### Regras de combinação e segurança
- Upgrades **data-driven** com `id`, `tags`, `rarity`, `prerequisites`, `exclusions`, `maxStacks`, `modifiers` e `onEvent`.
- Modificadores de atributos têm ordem previsível, com limites onde necessários; registrar a fórmula em teste.
- Eventos de projétil usam **orçamento por quadro e profundidade máxima de geração** para evitar recursão infinita. Uma explosão pode criar estilhaços, mas estilhaços não podem gerar uma explosão infinita.
- Toda carta apresenta **mudança visível** quando selecionada; cartas com efeito puramente numérico precisam de bom feedback na arma/HUD.
- Combos raros devem ser espetaculares, mas perder 90% do tempo da run por escolha ruim não deve ser inevitável.

---

## 7. Identidade visual e direção de arte

### Estilo
**Pixel art de alta qualidade com apresentação moderna**, fundos ilustrados com parcimônia, camadas de parallax, shaders leves, brilhos e partículas. Preferir resolução lógica consistente para sprites, contorno limpo e animações com personalidade. Não usar personagens com estilos e níveis de pixelização incompatíveis.

**Moodboard verbal:** desenho animado caótico + fliperama retrô + programa de TV falsamente luxuoso + cartas interativas sofisticadas.

### Paleta inicial sugerida (não final)
- Base de arena: carvão azulado `#151922`
- Superfícies de interface: ameixa escuro `#272035`
- Destaques positivos: turquesa `#42DEC4`
- Destaques de atenção/combo: âmbar `#FFC857`
- Dano/perigo: coral `#FF5964`
- Raridade épica: violeta `#B37CFF`
- Tipografia primária: branco quente `#F7F1E8`

**Acessibilidade:** não depender só das cores; som, contorno, padrões e formas distinguem estados.

### Regras de VFX
- Tiros: traços curtos, flash de boca da arma, estojos e pequenos impactos com decal temporário.
- Críticos: números com leve salto, som específico, brilho pequeno no inimigo.
- Explosões: centro brilhante, anel de choque, fumaça/partículas cartoon e *shake* com intensidade configurável.
- Enemies: partículas temáticas (penas de galinha, papel de escritório, gravatas, sinos de vaca, etc.).
- Lendários: breve transição audiovisual especial, sem paralisar o jogo por segundos desnecessários.
- **Regra de legibilidade:** tiros inimigos, hitboxes, telegraphs e jogador devem permanecer visíveis até em builds extremas.

---

## 8. UI/HUD/UX — fortemente inspirada no *game feel* de Balatro

**Objetivo:** cada botão, carta, número e transição deve parecer *tátil* e responsivo. Inspirar-se nos princípios de microanimação, não reproduzir as cartas, layout e arte de Balatro literalmente.

### HUD durante a onda
- **Superior esquerdo:** onda atual e barra/progresso de inimigos.
- **Superior direito:** score e multiplicador de combo com números animados.
- **Inferior esquerdo:** vida, arma atual, recarga/cadência quando aplicável.
- **Inferior direito:** pequenos ícones de efeitos de build que pulsam quando ativados.
- **Centro de tela:** limpo; só avisos curtos e informação de ameaça/boss.

### Tela de upgrades
- Fundo de gameplay levemente escurecido/pausado.
- **3 cartas grandes** com ilustração própria, raridade, nome, texto curto e impacto claramente explicado.
- Hover: carta sobe, inclina acompanhando cursor em poucos graus, brilho reagente à posição; sem animações lentas.
- Seleção: compressão curta, som, brilho, entrada instantânea na build, painel de árvore atualiza conexão de nós.
- Controles por mouse e teclado; textos legíveis e tooltips explicando mecânicas avançadas.
- Opção de consultar build completa sem atrito. **Reroll** futuro com custo/limite (TBD).

### Telas de produto
Menu principal; selecionar arma; entrar na run; escolha de upgrade; pausa/configurações; morte/resumo; rankings; perfil; coleção de cartas/armas (coleção pós-MVP).

### Qualidade de interação
- Microanimações em ~100–250 ms conforme função; transições maiores só quando agregam expectativa.
- `prefers-reduced-motion` e configuração interna para reduzir movimento, shake, flashes e densidade de partículas.
- Tipografia de números tabular quando adequada; atualização de score visualmente agradável sem causar saltos de layout.
- UI deve manter 60 FPS e não rerenderizar React a cada projétil ou cada tick da engine.
- Adotar linguagem visual própria de TV/arcade: selos, cards de patrocinadores fictícios, bordas de metal/plástico retrô, não mesa de pôquer.

---

## 9. Áudio

Áudio é componente de gameplay, não detalhe final. Usar SFX originais ou licenciados: tiros com identidades distintas, feedback de acerto e crítico, morte cartoon por espécie, vozes curtas do narrador, seleção de cartas e placar.

**Música:** trilha acelerada eletro-swing/chiptune moderno/funk arcade, com intensidade gradativa. A mixagem deve preservar SFX importantes. Permitir sliders separados para música, SFX e narração; mute geral.

**Áudio adaptativo (futuro):** no combo alto, bateria e efeitos de plateia aumentam, evitando excesso de repetição.

---

## 10. Arquitetura técnica proposta

### Stack inicial
- **TypeScript + Vite** como base de build.
- **Phaser** (versão estável fixada no projeto) para jogo 2D, sprites, input, câmera, colisão/engine de combate e VFX.
- **React** para menus, HUD, opções, cartas e rankings; **não usar React para renderizar cada projétil/inimigo**.
- **CSS** com tokens visuais e animações controladas; biblioteca de animação apenas se trouxer benefício real.
- **Supabase Auth + Postgres** para contas, perfil e rankings; **Supabase Edge Functions** para submissão/validação básica de pontuação.
- **Vercel** para front-end web.
- **Vitest** para regras puras e **Playwright** para smoke tests de navegação (depois do loop jogável).

### Separação essencial
1. **Core determinístico/isolado:** estado da run, atributos, regras de dano, upgrades, score e RNG com seed.
2. **Game runtime (Phaser):** atualização em loop fixo, física, input, spawn, eventos, objetos visuais, animação e áudio.
3. **UI (React):** menus, configurações, HUD em baixo volume de updates, cartas, overlays e rankings.
4. **Infra (Supabase):** autenticação, API de ranking, dados de perfil.

Bridge entre Phaser e React via **event bus tipado** ou store com seletores; atualização do HUD em intervalos adequados ou somente em mudanças relevantes. Nunca acoplar o cálculo de dano ao JSX.

### Estrutura inicial de diretórios (sugestão)
```text
src/
  app/                 # bootstrap React, rotas/telas, providers
  game/
    scenes/            # Boot, Arena, resultados
    entities/          # player, enemy, projectile
    systems/           # spawn, combat, collision, vfx, audio, wave
    data/              # armas, inimigos, upgrades, waves
    rendering/         # sprites, shaders e object pools
  core/
    combat/            # fórmulas e eventos determinísticos
    upgrades/          # engine de modifiers, sinergias, árvore
    scoring/           # combo, score e estatísticas
    run/               # estado, seed, progressão
  ui/
    components/        # Button, Card, Counter, Tooltip, HUD
    screens/           # Menu, Upgrades, GameOver, Leaderboard
    theme/             # tokens, tipografia, motion
  infra/
    supabase/          # cliente e serviços tipados
    persistence/       # adapters de dados
  shared/              # tipos comuns e event bus
public/assets/
  sprites/             # personagem, animais, projéteis, atlas
  ui/                  # ícones, frames e fontes licenciadas
  audio/               # tiros, efeitos, música
supabase/
  migrations/          # schema SQL versionado
  functions/           # submissão de score/validações
```

### Boas práticas
- Estados de jogo explícitos: `MENU`, `PLAYING`, `WAVE_CLEAR`, `UPGRADE_SELECT`, `PAUSED`, `GAME_OVER`.
- Preferir **configuração data-driven** em vez de grandes condicionais para armas, inimigos e cartas.
- Física, telegraphs e colisões devem ter comportamento reproduzível/consistente; fixed timestep quando possível.
- Separar visual de hitbox; documentar tamanho real de colisão por entidade.
- **Object pooling** para projéteis, textos de dano e partículas; limitar emissões por quadro; fazer culling de objetos fora da arena.
- Salvar settings localmente mesmo sem conta. Login deve ser opcional para **jogar**; obrigatório apenas para aparecer no ranking.
- Evitar `any` e tratar erros de rede sem interromper uma run.
- Não introduzir backend próprio/infra extra sem necessidade.

### Considerações sobre rankings e fraude
O cliente web **não é confiável** para validar placares: RLS sozinho não impede que alguém altere os valores enviados. Para o MVP:
- Identificar cada run por `run_id` único, associado a `user_id`, `game_version`, `seed`, `weapon_id`, `started_at`, `ended_at`, `wave`, `score` e `status`.
- **Não permitir INSERT direto do cliente** em placares oficiais; submissão via Edge Function autenticada, validando campos, limites plausíveis, tempo de run, versão aceita, duplicatas e rate limit.
- Manter pontuações como **não verificadas** ou “validação básica” enquanto não houver verificação robusta. Não prometer sistema anti-cheat infalível sem simulação autoritativa.
- Aplicar RLS por proprietário para dados privados e leitura pública só de perfis/placares aprovados. Sanitizar apelidos.
- Versões com alterações relevantes de balanceamento podem ter rankings por temporada/versão.

### Futuro Steam / Tauri (não implementar agora)
A mesma base React + Phaser poderá ser empacotada via Tauri se forem evitadas dependências exclusivas do browser na lógica central. Persistência deve usar **adapters** (Supabase na web; SQL local ou integração externa na versão desktop conforme decisão futura). Cloud leaderboard e dados locais são responsabilidades diferentes. Steamworks, conquistas e sincronização entram como módulos opcionais depois da versão web validada.

---

## 11. Escopo do MVP e fases de implementação

### Fase 0 — Fundação visual e jogável
**Entrega:** aplicação Vite+React+Phaser inicial, arena lateral 16:9 adaptável, personagem temporário, movimento/pulo/mira/disparo, uma arma (pistola), colisões, vida e reinício.

**Critérios:** a ação é agradável mesmo com sprites temporários; mouse aim e movimento não ficam presos ao framerate; deploy web funciona.

### Fase 1 — Vertical slice completa
**Entrega:**
- 2 armas: pistola e shotgun.
- 5 animais: Pato Pistoleiro, Vaca Loca, Galinha Rambo, Pombo Mafioso e Porco Executivo.
- 1 chefe: Don Pombone.
- 10 ondas com escalada, cartas entre ondas e pelo menos **12 upgrades funcionais**.
- 3 ramos identificáveis na árvore de melhorias.
- HUD, menu, pausa, tela de morte e placar local.
- Primeiro pacote de VFX e SFX original/provisório licenciado.

**Critérios:** é possível completar 10 ondas, identificar imediatamente o padrão de cada inimigo, criar pelo menos 3 builds distintamente divertidas e reiniciar a run em poucos cliques.

### Fase 2 — Polimento e lançamento beta web
**Entrega:** arte consistente para protagonista/animais, animações de carta com excelente qualidade, VFX avançado, mixagem de áudio, otimização, Supabase Auth, perfil e ranking de validação básica, deploy Vercel e testes.

**Critérios:** build web estável em navegador desktop moderno, menu funcional, ranking sem escrita livre por cliente e efeitos com opção de qualidade reduzida.

### Fase 3 — Expansão após validação
Mais animais e bosses, eventos de arena, armas extras, cartas lendárias, metaprogressão leve, desafios diários/semanais, cosméticos, acessibilidade adicional e eventual preparação para Tauri/Steam.

---

## 12. Requisitos de desempenho e teste

- **Meta:** 60 FPS em desktop de referência definido nos primeiros testes; manter input responsivo durante o caos.
- Medir tempo médio e P95 de quadro; evitar travamentos visíveis ao spawnar chefes e explosões.
- Testar cenários com **100+ projéteis e múltiplos VFX simultâneos**; escalar a meta conforme hardware de referência.
- Qualidade gráfica: `Low`, `Medium`, `High` e opção de reduzir screen shake, flashes, números flutuantes e partículas.
- Separar efeitos cosméticos de cálculo de dano para que reduzir partículas não altere a jogabilidade.
- Testar resize de janela, mudança de aba, pause/unpause, desconexão, login opcional, uso de teclado e mouse, reinício, upgrades repetidos e árvores com pré-requisitos.
- Registrar métricas simples de protótipo: tempo médio por onda, arma escolhida, cartas escolhidas, mortes, intensidade das builds e FPS de teste (sem coleta de dados pessoais desnecessária).

---

## 13. Diretrizes para Claude Code

**Prioridade absoluta:** criar primeiro um **núcleo de combate divertido**, não uma fachada bonita com dezenas de menus vazios.

1. Antes de escrever código, inspecionar a estrutura existente e propor um plano por incrementos pequenos.
2. Implementar Fase 0 end-to-end e validar no navegador antes de iniciar Fase 1.
3. Em cada incremento, manter projeto executável com instruções claras de `npm install`, `npm run dev`, `npm run build` e testes disponíveis.
4. Usar placeholders procedurais apenas para destravar o protótipo; identificá-los explicitamente como temporários e conservar a direção de arte definida neste documento.
5. Não substituir a premissa de animais cartunescos por aliens, robôs ou humanos genéricos.
6. Não converter o jogo para visão top-down ou para auto-shooter sem discussão: a proposta inicial é **arena 2D lateral, mira e disparo manual**.
7. Upgrades, armas e inimigos **devem ser configurados por dados** e testáveis independentemente de UI.
8. UI de seleção de upgrade deve ter animações fluidas e expressivas, inspiradas na interação de Balatro, sem copiar o visual literalmente.
9. Não criar dependências de Supabase para que o combate local funcione; integrar auth e leaderboard apenas na fase adequada.
10. Após cada entrega: resumir arquivos alterados, comandos de teste, decisões técnicas e próximos passos, sem começar fases futuras automaticamente.

### Primeiro prompt recomendado para Claude Code

> Você é o desenvolvedor principal do **ShootUp!**. Leia integralmente `SHOOTUP_GDD.md` e trate-o como fonte de requisitos. Quero começar pela **Fase 0**. Primeiro, proponha uma arquitetura enxuta e um plano de execução com pequenas etapas; depois implemente um protótipo jogável em **TypeScript + Vite + React + Phaser**, com arena 2D lateral, câmera fixa, personagem provisório, gravidade, movimento A/D, pulo W/espaço, mira no mouse, tiro contínuo pelo botão esquerdo, colisão, uma pistola, um inimigo provisório, HUD mínimo e reinício. Separe lógica de combate, Phaser e React. O combate deve funcionar offline sem Supabase. Prefira desempenho, sensação de tiro e organização do código a menus sofisticados. Ao fim, execute build/testes disponíveis e explique como testar no navegador. **Não avance para as fases seguintes sem eu pedir.**

---

## 14. Questões deliberadamente abertas

Estas são decisões de direção, não bloqueios para Fase 0:
- Protagonista humano cartunesco vs. boneco de ação.
- Nome definitivo do programa (“The World's Worst Show”) e idioma padrão do narrador.
- Se a árvore fica apenas no painel contextual entre ondas ou se haverá uma tela separada de detalhes.
- Balanceamento de valores, raridades, duração exata das ondas, velocidade e número de inimigos.
- Arte original final: sprites pixel art desenhados, rig 2D ou abordagem híbrida.
- Estratégia anti-cheat mais robusta para rankings competitivos de longo prazo.
- Projeto de portabilidade SQL/Tauri/Steam e integração Steamworks.

## 15. Definição de sucesso do primeiro protótipo

Uma pessoa que nunca jogou ShootUp! consegue iniciar uma run sem tutorial longo, rir de pelo menos um inimigo, achar a pistola gostosa de disparar, entender como sobreviver à primeira onda, selecionar uma melhoria sem confusão e perceber uma diferença real no tiro durante a segunda. Se isso não for divertido, **não é hora de adicionar dezenas de cartas ou telas**.

---

## 16. Referências conceituais

- Seraph's Last Stand — site da desenvolvedora: https://www.sadsocket.com/seraphs
- Seraph's Last Stand — versão original em HTML5: https://socketlab.itch.io/laststand
- Balatro — referência de design de interação: https://www.playbalatro.com/

**Nota de originalidade:** ShootUp! deve desenvolver personagens, sprites, trilha, nomenclatura, interface e conteúdo próprios. As referências definem padrões de *game feel* e de estrutura roguelite, não autorização para reproduzir arte, sons, interfaces ou código de terceiros.
