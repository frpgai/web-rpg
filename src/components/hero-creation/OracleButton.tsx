import './hero-creation.css';

interface OracleButtonProps {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

export function OracleButton({
  onPress,
  disabled = false,
  label = 'CONSULTAR ORÁCULO',
  hint,
}: OracleButtonProps) {
  return (
    <button 
      type="button" 
      className={`oracle-panel ${disabled ? 'oracle-panel-disabled' : ''}`} 
      onClick={onPress} 
      disabled={disabled}
    >
      <div className="oracle-left">
        <div className="oracle-dice-box">
          <svg 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {/* Simple representation of two overlapping dice */}
            <rect x="2" y="2" width="12" height="12" rx="2" ry="2"></rect>
            <rect x="10" y="10" width="12" height="12" rx="2" ry="2" fill="#ffb86c" stroke="#ffb86c"></rect>
          </svg>
        </div>
        <div className="oracle-text-container">
          <span className="oracle-primary-text">{label}</span>
          {hint ? <span className="oracle-secondary-text">{hint}</span> : null}
        </div>
      </div>
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        className="oracle-star-icon"
      >
        {/* 4-pointed star */}
        <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z"></path>
      </svg>
    </button>
  );
}
