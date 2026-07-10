import React from 'react';
import { getAssetUrl } from '../../utils/url';
import './Avatar.css';

export interface AvatarProps {
  /**
   * The path or URL of the avatar image.
   */
  readonly url?: string | null;
  /**
   * The name of the character/user. Used for alt tag and fallback letter.
   */
  readonly name?: string;
  /**
   * Predefined sizes or a number in pixels.
   * - 'xs': 28px
   * - 'sm': 40px
   * - 'md': 56px
   * - 'lg': 80px
   * - 'xl': 120px
   * @default 'md'
   */
  readonly size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /**
   * Custom className to apply to the wrapper element.
   */
  readonly className?: string;
  /**
   * Custom style to apply to the wrapper element.
   */
  readonly style?: React.CSSProperties;
}

export function Avatar({
  url,
  name = '',
  size = 'md',
  className = '',
  style,
}: AvatarProps) {
  const isPredefinedSize = typeof size === 'string';
  const sizeClass = isPredefinedSize ? `ui-avatar--size-${size}` : '';
  
  const customStyles: React.CSSProperties = {
    ...style,
    ...(typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : {}),
  };

  const hasImage = Boolean(url);
  const firstLetter = name.trim().charAt(0).toUpperCase();

  return (
    <div
      className={`ui-avatar ${sizeClass} ${className}`.trim()}
      style={customStyles}
    >
      {hasImage ? (
        <img
          src={getAssetUrl(url)}
          alt={name || 'Avatar'}
          className="ui-avatar-img"
          loading="lazy"
        />
      ) : (
        <div className="ui-avatar-fallback">
          {firstLetter ? (
            <span className="ui-avatar-letter">{firstLetter}</span>
          ) : (
            <span className="material-symbols-outlined ui-avatar-placeholder-icon">
              person
            </span>
          )}
        </div>
      )}
    </div>
  );
}
