


type Props = {
  color?: string;
  size?: 'small' | 'medium' | 'large';
};

export function Spinner({ color, size = 'medium' }: Props) {
  // Map spinner sizes to the corresponding CSS classes defined in App.css
  const sizeClass = size === 'small' ? 'loading-spinner-small' : 'loading-spinner';
  
  return (
    <div 
      className={sizeClass} 
      style={color ? { borderTopColor: color } : undefined}
      role="status"
      aria-label="Carregando"
    />
  );
}
