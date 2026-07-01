import type { AvailableCampaign } from '../../types';
import './CampaignCard.css';


export const CAMPAIGN_CARD_WIDTH = 320;

type Props = {
  campaign: AvailableCampaign;
  onPress: () => void;
  active?: boolean;
};

export function CampaignCard({ campaign, onPress, active = false }: Props) {
  const inner = (
    <div className="dashboard-campaign-card-gradient">
      <div className="dashboard-campaign-card-top-row">
        {active && (
          <div className="dashboard-campaign-card-active-badge">
            <span className="dashboard-campaign-card-active-badge-text">MISSÃO ATIVA</span>
          </div>
        )}
      </div>

      <div className="dashboard-campaign-card-bottom">
        <span className="dashboard-campaign-card-name">{campaign.name}</span>
        <span className="dashboard-campaign-card-system">
          NV {campaign.level_range}
        </span>
        {active && (
          <div className="dashboard-campaign-card-continue-row">
            <button
              className="dashboard-campaign-card-continue-button"
              onClick={(e) => {
                e.stopPropagation();
                onPress();
              }}
              type="button"
            >
              <span className="dashboard-campaign-card-continue-text">CONTINUAR AVENTURA</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const cardStyle = campaign.cover_url
    ? { backgroundImage: `url(${campaign.cover_url})` }
    : {};

  return (
    <div
      className={`dashboard-campaign-card ${!campaign.cover_url ? 'dashboard-campaign-card-cover-fallback' : ''}`}
      style={{ ...cardStyle, width: CAMPAIGN_CARD_WIDTH }}
      onClick={onPress}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onPress();
        }
      }}
    >
      {inner}
    </div>
  );
}
