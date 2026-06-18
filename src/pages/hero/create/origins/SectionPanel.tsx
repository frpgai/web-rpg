import { SvgIcon } from '../../../../components/ui/SvgIcon';
import { SkeletonCard } from './SkeletonCard';

interface SectionPanelProps {
  icon: string;
  iconColor: string;
  title: string;
  loading: boolean;
  /** Slot de erro — a página decide o que renderizar (ex: <ErrorRow />) */
  errorSlot?: React.ReactNode;
  skeletonHeight?: number;
  skeletonCount?: number;
  gridClassName: string;
  children: React.ReactNode;
}

export function SectionPanel({
  icon,
  iconColor,
  title,
  loading,
  errorSlot,
  skeletonHeight = 80,
  skeletonCount = 4,
  gridClassName,
  children,
}: SectionPanelProps) {
  return (
    <div className="origins-glass-panel">
      <div className="origins-section-header-row">
        <SvgIcon name={icon} size={20} color={iconColor} />
        <h2 className="origins-section-title">{title}</h2>
      </div>

      {loading ? (
        <div className={gridClassName}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonCard key={i} height={skeletonHeight} />
          ))}
        </div>
      ) : errorSlot ? (
        errorSlot
      ) : (
        <div className={gridClassName}>
          {children}
        </div>
      )}
    </div>
  );
}
