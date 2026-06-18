


type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'body' | 'narrative' | 'muted' | 'title';
};

export function Text({ variant = 'body', className = '', style, children, ...props }: Props) {
  // Map variant to styling classes if needed (standard fallback to span)
  const variantClass = variant !== 'body' ? `text-variant-${variant}` : '';
  
  return (
    <span 
      className={`${variantClass} ${className}`.trim()} 
      style={style}
      {...props}
    >
      {children}
    </span>
  );
}
