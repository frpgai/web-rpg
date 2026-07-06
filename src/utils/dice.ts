// Utilitário de rolagem de dado — hoje só usado no fluxo de Investigar POI
// (mesa de jogo). Rola apenas o d20 "cru"; qualquer bônus de perícia deve
// ser somado pelo backend (Regra de Ouro de web-rpg/CLAUDE.md: nenhum
// cálculo de stats no frontend), nunca aqui.
export function rollD20(): number {
  return 1 + Math.floor(Math.random() * 20);
}
