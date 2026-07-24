import { useRef, useCallback } from 'react';

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * HapticButton wraps any button-like element with a transparent iOS switch overlay.
 * On iOS 26.5+, the only way to fire haptics is direct user interaction with a
 * real <input type="checkbox" switch>. This component overlays one on top of
 * the button's hit area — user taps the switch, gets haptic, and we fire onClick.
 *
 * On Android/non-iOS: just renders a normal button with vibration API.
 */
interface HapticButtonProps {
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
  'aria-label'?: string;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

export default function HapticButton({
  onClick,
  className = '',
  disabled = false,
  children,
  'aria-label': ariaLabel,
  type = 'button',
  style,
}: HapticButtonProps) {
  const switchRef = useRef<HTMLInputElement>(null);

  const handleSwitchChange = useCallback(() => {
    if (disabled) return;
    onClick();
  }, [onClick, disabled]);

  const handleButtonClick = useCallback(() => {
    if (disabled) return;
    // Android vibration
    if (!isIOS && navigator.vibrate) {
      navigator.vibrate(10);
    }
    onClick();
  }, [onClick, disabled]);

  // iOS: overlay a real switch input
  if (isIOS) {
    return (
      <div className={`relative ${className}`} style={style}>
        {/* Visual button content (not interactive) */}
        <div
          className="pointer-events-none flex items-center justify-center w-full h-full"
          aria-hidden="true"
        >
          {children}
        </div>

        {/* Invisible switch overlay — user's finger touches this */}
        <input
          ref={switchRef}
          type="checkbox"
          // @ts-ignore — switch is a non-standard attribute
          switch=""
          onChange={handleSwitchChange}
          disabled={disabled}
          aria-label={ariaLabel || 'action'}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          style={{ WebkitAppearance: 'none', appearance: 'none' }}
        />
      </div>
    );
  }

  // Non-iOS: standard button with vibration
  return (
    <button
      type={type}
      onClick={handleButtonClick}
      disabled={disabled}
      className={className}
      style={style}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
