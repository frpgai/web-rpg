import { useEffect, useState } from 'react';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { Spinner } from '../../components/ui/Spinner';
import { campaignApi } from '../../api/services/campaign';
import type { CampaignDetail, CampaignListItem } from '../../types';
import './CampaignDetailSheet.css';

interface CampaignDetailSheetProps {
  campaign: CampaignListItem | null;
  onClose: () => void;
  onSelectCampaign: (campaign: CampaignListItem) => void;
}

function levelRangeLabel(item: CampaignListItem): string {
  return `Níveis ${item.level_start} a ${item.level_end}`;
}

export function CampaignDetailSheet({ campaign, onClose, onSelectCampaign }: CampaignDetailSheetProps) {
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!campaign) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    campaignApi
      .getDetail(campaign.id)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        // Endpoint de detalhe pode ainda não existir no backend — degrada
        // graciosamente exibindo apenas os dados já conhecidos da listagem.
        console.error('Failed to load campaign detail:', err);
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [campaign]);

  if (!campaign) return null;

  const synopsis = detail?.description;
  const adventures = detail?.adventures ?? [];

  return (
    <BottomSheet
      open={!!campaign}
      onClose={onClose}
      title={campaign.title}
      panelClassName="campaign-detail-sheet"
      headerExtra={
        <div className="campaign-detail-badges">
          <span className="campaign-detail-badge campaign-detail-badge-level">
            {levelRangeLabel(campaign)}
          </span>
          {campaign.tags.map((tag) => (
            <span key={tag.id} className="campaign-detail-badge">
              {tag.name}
            </span>
          ))}
        </div>
      }
      footer={
        <div className="campaign-detail-footer">
          <button
            type="button"
            className="campaign-detail-select"
            onClick={() => onSelectCampaign(campaign)}
          >
            <span className="material-symbols-outlined">bolt</span>
            Selecionar Campanha
          </button>
          <button type="button" className="campaign-detail-back" onClick={onClose}>
            Voltar
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="campaign-detail-loading">
          <Spinner color="var(--color-primary)" size="medium" />
        </div>
      ) : (
        <>
          <p className="campaign-detail-synopsis">
            {synopsis ?? 'Sinopse ainda não disponível para esta campanha.'}
          </p>

          <section className="campaign-detail-chapters">
            <div className="campaign-detail-chapters-heading">
              <span className="material-symbols-outlined">auto_stories</span>
              <h4>Capítulos da Saga</h4>
            </div>

            {adventures.length > 0 ? (
              <ul className="campaign-detail-chapters-list">
                {adventures.map((adventure, index) => (
                  <li key={adventure.id} className="campaign-detail-chapter">
                    <span className="campaign-detail-chapter-index">
                      {index + 1}
                    </span>
                    <span className="campaign-detail-chapter-title">{adventure.title}</span>
                    <span className="material-symbols-outlined campaign-detail-chapter-icon">
                      chevron_right
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="campaign-detail-chapters-empty">
                Nenhum capítulo disponível no momento.
              </p>
            )}
          </section>
        </>
      )}
    </BottomSheet>
  );
}
