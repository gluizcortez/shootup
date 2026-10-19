# ShootUp! — Instruções para Claude Code

Leia **`SHOOTUP_GDD.md` integralmente** antes de propor arquitetura ou implementar funcionalidades. Esse documento define a visão, o escopo, a temática, as prioridades e a ordem das entregas.

## O que estamos construindo
Um jogo web 2D lateral de arena fixa, shoot 'em up roguelite em ondas. Movimento e disparo manuais; armas de fogo com comportamentos distintos; upgrades em cartas e árvore de sinergias; animais inimigos cartunescos e absurdos (galinha de metralhadora, pato de pistola, vaca descontrolada, porco executivo, pombos mafiosos, cão e gato siameses). Interface extremamente fluida e agradável, inspirada no *game feel* tátil de Balatro — sem copiar sua arte.

## Prioridades
1. **Game feel e FPS** antes de volume de conteúdo.
2. **Protótipo jogável** antes de menus sofisticados e serviços online.
3. **Lógica data-driven e testável** para armas, inimigos, upgrades, ondas e pontuação.
4. **Separação forte entre engine (Phaser), UI (React), core e infraestrutura**.
5. **Originalidade artística**; sem usar sprites, sons, imagens ou código de outros jogos sem licença.

## Stack pretendida
TypeScript, Vite, React, Phaser, Supabase (Auth e leaderboard em fase posterior) e Vercel. Tauri/Steam só numa fase futura. Não introduzir serviços ou bibliotecas adicionais sem justificativa.

## Como trabalhar
- Antes de mudar arquivos, examinar o repositório e explicar o plano incremental.
- Executar **somente a fase solicitada**; não avançar automaticamente para a próxima.
- Desenvolver primeiro a Fase 0 descrita no GDD: arena, jogador, física, mira, tiro, inimigo, HUD mínimo, morte/reinício.
- Após cada incremento, informar o que mudou, como testar, o que ainda falta e problemas conhecidos.
- Validar `npm run build` e testes existentes quando disponíveis. Se algum comando não existir, registrar isso em vez de afirmar que foi executado.
- Priorizar que o jogo funcione offline; autenticação e ranking não devem impedir uma run.
- Manter performance e legibilidade mesmo com muitos projéteis/efeitos; separar VFX de lógica de dano.
- Implementar com TypeScript estrito, IDs estáveis, módulos coesos e tratamento de erros.
- Não submeter score diretamente do cliente a uma tabela pública no Supabase; seguir as recomendações do GDD.

## Restrições de produto
- A visão inicial é **lateral**, não top-down.
- Disparo **manual pelo mouse**, não auto-aim/auto-fire (a menos que uma carta futura altere isso explicitamente).
- Protagonista e inimigos legíveis, sem gore realista.
- O elenco de inimigos deve ser composto por animais cômicos.
- Todas as armas equipáveis do jogador são **armas de fogo**.
- UI expressiva e rápida, com opção de redução de movimento e intensidade gráfica.

## Primeira tarefa
Implementar apenas a **Fase 0** de `SHOOTUP_GDD.md`. Antes de codificar, apresente a estrutura proposta e uma sequência curta de etapas. Depois crie a aplicação e entregue um protótipo jogável com instruções de execução e critérios de teste.
