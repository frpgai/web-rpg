import './AvatarCard.css';

export interface AvatarCardProps {
  id: string;
  url: string;
  label: string;
  recommended: boolean;
  selected: boolean;
  onClick: (id: string) => void;
}

function SilhouettePlaceholder() {
  return (
    <svg
      className="avatar-card-placeholder-svg"
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="48" cy="36" r="18" />
      <path d="M12 84c0-19.882 16.118-36 36-36s36 16.118 36 36" />
    </svg>
  );
}

export function AvatarCard({ id, url, label, recommended, selected, onClick }: AvatarCardProps) {
  const isEmpty = !url;

  return (
    <button
      type="button"
      className={`avatar-card${selected ? ' avatar-card--selected' : ''}`}
      onClick={() => onClick(id)}
      aria-label={`Selecionar avatar: ${label}${recommended ? ' (recomendado)' : ''}`}
      aria-pressed={selected}
    >
      {isEmpty ? (
        <div className="avatar-card-placeholder">
          <SilhouettePlaceholder />
        </div>
      ) : (
        <img
          src={url}
          alt={label}
          className={`avatar-card-img${selected ? ' avatar-card-img--selected' : ''}`}
        />
      )}

      {recommended && (
        <span className="avatar-card-badge">RECOMENDADO</span>
      )}

      {selected && (
        <span
          className="material-symbols-outlined avatar-card-check-icon"
          aria-hidden="true"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          verified
        </span>
      )}
    </button>
  );
}
