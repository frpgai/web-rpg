import { useTranslation } from 'react-i18next';
import type { InventoryItem } from '../../../../types';

function InventoryCard({ item }: { item: InventoryItem }) {
  const { t } = useTranslation('common');
  const rarity = item.rarity;
  return (
    <div className={`hd-inv-item hd-inv-item--${rarity}`}>
      <div className={`hd-inv-icon-box hd-inv-icon-box--${rarity}`}>
        <span className="material-symbols-outlined">inventory_2</span>
      </div>
      <div className="hd-inv-info">
        <p className="hd-inv-name">{item.name}</p>
        <p className="hd-inv-rarity">{t(`rarity.${rarity}`) || rarity}</p>
      </div>
      <span className="hd-inv-weight">{item.weight_kg} kg</span>
    </div>
  );
}

type Props = { items: InventoryItem[] };

export function HeroInventory({ items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section className="hd-section">
      <h2 className="hd-section-title">
        <span className="material-symbols-outlined">backpack</span>
        Inventário
      </h2>
      <div className="hd-inv-list">
        {items.map((item) => (
          <InventoryCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
