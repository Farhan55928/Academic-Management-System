import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Sheet — a drawer or bottom-sheet overlay.
 *
 * Variants:
 *   - "right"  → edge drawer (used for the sidebar on mobile)
 *   - "bottom" → bottom sheet on mobile, centred modal on ≥768px
 *
 * Behaviour:
 *   - Mounts in a portal (escapes any transform/overflow ancestor).
 *   - Locks body scroll while open.
 *   - Dismisses on Escape.
 *   - Closes on backdrop click.
 *   - Restores focus to the trigger element on close.
 */
export default function Sheet({ open, onClose, variant = 'bottom', title, children, ariaLabel }) {
  const sheetRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
      }
    };
    document.addEventListener('keydown', onKey);

    requestAnimationFrame(() => {
      const focusable = sheetRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    });

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      if (previouslyFocusedRef.current?.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [open]);

  if (!open && typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        className={`sheet-backdrop ${open ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className={`sheet sheet-${variant} ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        aria-hidden={!open}
        inert={!open}
        // When closed, take it out of the tab order entirely.
        tabIndex={open ? -1 : undefined}
      >
        {variant === 'bottom' && <div className="sheet-handle" />}
        {title && (
          <div className="sheet-header">
            <h2 className="sheet-title">{title}</h2>
          </div>
        )}
        <div className="sheet-body">{children}</div>
      </div>
    </>,
    document.body
  );
}
