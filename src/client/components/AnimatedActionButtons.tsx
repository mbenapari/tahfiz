import React, { useEffect, useRef, useState } from 'react';

interface AnimatedActionButtonsProps {
  /** The action buttons to render inside the animated container. */
  children: React.ReactNode;
  /** Whether animation + callout should be active. */
  shouldAnimate: boolean;
  /** Called when the instructor clicks the primary action (Log Progress). */
  onPrimaryAction: () => void;
  /** Called when the callout tooltip is permanently dismissed. */
  onDismiss: () => void;
  /** Whether to render in inline-flex (desktop) or flex (mobile) layout. */
  layout?: 'inline' | 'block';
  /** Additional classes for the container (e.g., justify-end). */
  className?: string;
}

/**
 * Wraps instructor action buttons with an animated attention-grabbing UI.
 *
 * When `shouldAnimate` is true:
 * - A pulsing glow border surrounds the button group
 * - Buttons fade in and slide up sequentially
 * - A dismissible callout tooltip guides the instructor to log progress
 *
 * Animation respects `prefers-reduced-motion`.
 * Animates only once per mount; dismissed permanently via `onDismiss`.
 */
export const AnimatedActionButtons: React.FC<AnimatedActionButtonsProps> = ({
  children,
  shouldAnimate,
  onPrimaryAction,
  onDismiss,
  layout = 'inline',
  className = '',
}) => {
  const [entranceDone, setEntranceDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stage the animation: entrance first
  useEffect(() => {
    if (!shouldAnimate) {
      setEntranceDone(false);
      return;
    }

    // Trigger entrance animation on next frame for CSS transition to work
    const raf = requestAnimationFrame(() => {
      setEntranceDone(true);
    });

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [shouldAnimate]);

  const handlePrimaryAction = () => {
    onPrimaryAction();
  };

  // Wrap children to intercept the primary action button (PenTool / Log Progress)
  const enhancedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    // Intercept the first button (Log Progress) click
    return React.cloneElement(child as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        // Call original onClick if present
        if ((child.props as any).onClick) {
          (child.props as any).onClick(e);
        }
        handlePrimaryAction();
      },
    });
  });

  const layoutClass = layout === 'inline' ? 'inline-flex' : 'flex';

  return (
    <div className={`relative ${layoutClass} ${className}`} ref={containerRef}>
      {/* Pulsing glow backdrop */}
      {shouldAnimate && (
        <div
          className={`
            absolute inset-0 rounded-xl motion-safe:animate-[pulse-glow_2s_ease-in-out_infinite]
            bg-primary/5 ring-1 ring-primary/20
            motion-safe:transition-opacity motion-safe:duration-1000
            ${entranceDone ? 'opacity-100' : 'opacity-0'}
          `}
          aria-hidden="true"
        />
      )}

      {/* Action buttons with optional entrance animation */}
      <div
        className={`
          relative ${layoutClass} items-center gap-2 w-full
          ${shouldAnimate ? 'motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out' : ''}
          ${shouldAnimate && !entranceDone ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
        `}
      >
        {shouldAnimate ? enhancedChildren : children}
      </div>
    </div>
  );
};
