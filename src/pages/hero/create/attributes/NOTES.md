# AttributesPage — Convenções

Ver regra geral em `web-rpg/AGENTS.md` → "Sem Fallback Mudo".

- `hero.sheet`/`hero.attributes` **não existem mais** no backend (era código morto, removido). Nunca reintroduzir esse fallback.
- Valores mínimos de atributo vêm de `PointBuyRules.min` (carregado direto em `AttributesPage.tsx` via `getPointBuyRules()`), regra de sistema — não hardcodear esse número solto no componente.
- Não existe endpoint que devolva os valores de atributo já salvos de um hero-rascunho (base/bonus por slug). `attrs` sempre começa do zero em `rules.min` ao entrar na tela — não restaura alocação salva ao dar refresh. Se isso virar problema, precisa de um endpoint novo (ver conversa sobre `GetByID` vs `GetByIDOld`).
