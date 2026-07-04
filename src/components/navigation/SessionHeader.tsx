import './SessionHeader.css';

type Props = {
  title: string;
  onMenuPress?: () => void;
  onSettingsPress?: () => void;
};

/**
 * TopAppBar persistente das telas de sessão ativa (Storytelling, Timeline,
 * Mesa de Jogo Ativa) — réplica pixel-perfect do Stitch (project
 * 15326270198202696484, screens 5a5d72af972449828dca5c2df0e8ab62 e
 * fa77bf96766d4bbcafa4ea2ff29c6d43): ícone de hambúrguer à esquerda, título
 * centralizado, ícone de configurações à direita.
 *
 * Decisão de consistência (documentada no PR): o Stitch tem duas variações
 * de layout — a screen "Capítulo 1" centraliza o título entre os dois
 * ícones (TopAppBar clássica), enquanto "Praça de Thornwick" agrupa
 * hambúrguer+título à esquerda com título em dourado/glow. Optou-se pela
 * variação centralizada como componente único e consistente em todas as
 * telas de sessão ativa, em vez de duas variações — mais previsível para o
 * usuário navegar entre Timeline/Storytelling/Mesa de Jogo.
 *
 * `onMenuPress`/`onSettingsPress` são no-op documentados até existir um
 * drawer de navegação ou tela de configurações de sessão.
 */
export function SessionHeader({ title, onMenuPress, onSettingsPress }: Props) {
  return (
    <header className="sessionheader-root">
      <button
        type="button"
        className="sessionheader-icon-btn"
        aria-label="Abrir menu"
        onClick={onMenuPress}
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <h1 className="sessionheader-title">{title}</h1>

      <button
        type="button"
        className="sessionheader-icon-btn"
        aria-label="Configurações"
        onClick={onSettingsPress}
      >
        <span className="material-symbols-outlined">settings</span>
      </button>
    </header>
  );
}
