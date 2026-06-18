import { colors } from '../../constants/theme';
import './InitiativeBanner.css';


type Props = {
  data: {
    total: number;
    next: {
      turn_id: string;
      campaign_id: string;
      campaign_name: string;
      hero_name: string;
      hero_avatar_url: string | null;
      created_at: string;
    } | null;
  } | null;
  onPress: () => void;
};

export function InitiativeBanner({ data, onPress }: Props) {
  if (!data || !data.next) return null;

  return (
    <div className="dashboard-initiative-banner" onClick={onPress} role="button" tabIndex={0}>
      <div className="dashboard-initiative-pulse-bg" />
      <div className="dashboard-initiative-content">
        <div className="dashboard-initiative-left">
          <i className="material-icons" style={{ color: colors.primary, fontSize: 18 }}>flash_on</i>
          <span className="dashboard-initiative-label">Sua Iniciativa</span>
        </div>
        <span className="dashboard-initiative-subtitle">
          Turno de <strong>{data.next.hero_name}</strong> em <em>{data.next.campaign_name}</em>
        </span>
        <button 
          className="dashboard-initiative-button" 
          onClick={(e) => { 
            e.stopPropagation(); 
            onPress(); 
          }}
        >
          <span className="dashboard-initiative-button-text">AGIR AGORA</span>
        </button>
      </div>
    </div>
  );
}
