# RPG Imersivo — Diretrizes do Frontend Web

## Stack Tecnológica (`web-rpg`)

- Vite + React + TypeScript, mobile-first (`max-width: 480px`)
- Roteamento: wouter (hash-based, WebView-ready)
- Estado: Zustand | HTTP Client: ky (com interceptor de JWT)
- Estilo: Vanilla CSS com CSS Custom Properties (tokens em `src/styles/tokens.css`) — sem biblioteca de componentes UI de terceiros
- PWA: Vite PWA Plugin | WebSocket nativo
- Bridge WebView: `src/utils/bridge.ts`

## Regra de Ouro Arquitetural (Sem Cálculo no Frontend)

- **Nenhuma regra de negócio ou cálculo de stats ocorre no frontend** — HP, DEF, bônus de atributo, slots de magia (spell slots) e qualquer outro valor derivado são sempre calculados e retornados pelo backend. O frontend é responsável apenas por exibir dados e capturar o input do usuário.

## Sem Fallback Mudo (Falhas Devem Ser Visíveis)

- **Proibido** usar `?.`/`??`/`try{} catch {}` vazio/`as any` como forma de "blindar" contra dado ausente ou fora do formato esperado vindo da API. Isso é um dos principais problemas do projeto: uma quebra de contrato do backend (campo renomeado, resposta com formato diferente, endpoint mudou) fica **indistinguível** de um estado legítimo (ainda carregando, usuário não preencheu aquele campo), e o bug só aparece muito depois, exigindo investigação longa pra achar a causa.
- Se um dado é **garantido pelo contrato da API** (o backend sempre retorna aquele campo para aquele estado), acesse direto (`hero.ancestry.name`), sem optional chaining nem fallback. Se o campo não vier, deixe o `TypeError` estourar e aparecer no console — é o sinal correto de que o contrato quebrou.
- Reserve tratamento de erro (try/catch, estados de loading/error) apenas para o que é **genuinamente incerto**: falha de rede, 404/403 esperado, campo opcional documentado como tal.
- Nunca silencie um `catch` sem logar (`console.error`) e sem propagar/exibir algo pro usuário. Um `catch {}` vazio com comentário tipo "falha → segue outro fluxo" esconde o erro real atrás de um comportamento que parece intencional.

## Stitch (Design System) — Pixel-Perfect via MCP

- Projeto: https://stitch.withgoogle.com/projects/15326270198202696484
- Estética escura, medieval moderna
- Design pixel-perfect via Stitch — nunca aproximar cores ou espaçamentos.
- O agente frontend **SEMPRE** deve chamar `mcp__stitch__get_screen` antes de implementar qualquer tela.

## Regras CSS (Prevenção de Colisões)

Classes definidas em arquivos CSS locais devem seguir:
1. **Escopo de Classes:** Use prefixos específicos da tela ou componente (ex: `.origins-skeleton-card`). Nunca use nomes genéricos sem prefixo (ex: `.skeleton-card`, `.error-text`), pois eles colidem com `App.css`.
2. **Validação Automática:** O hook `web-rpg/.githooks/pre-commit` executa esta checagem automaticamente a cada commit com arquivos `.css` staged. Nenhuma ação manual necessária.

## CSS Design Tokens (Otimizado)

- O projeto usa CSS Custom Properties. Cores, fontes e medidas hardcoded são **PROIBIDOS**.
- Para consultar a paleta e o design system, leia obrigatoriamente o arquivo [web-rpg/src/styles/tokens.css](file:///Users/felipe/Documents/rpg/web-rpg/src/styles/tokens.css).

## i18n e Consumo de Dados da API (Sem Dados Hardcoded)

- **Sem Dicionários Hardcoded**: Não é permitido criar dicionários estáticos ou mapeamentos traduzidos no frontend para dados estruturais do herói que venham da API (como nomes de atributos, abreviações, perícias, tipos de habilidades ou rótulos de raridades). Todas as informações estruturais de exibição e seus respectivos rótulos (como `name`, `abbreviation`, `type_label`, `rarity_label`) devem ser providos e consumidos diretamente a partir do payload retornado pelo backend.

