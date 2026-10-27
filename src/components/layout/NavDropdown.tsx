import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronIcon } from '../icons/ChevronIcon';
import type { NavItem } from '../../config/navigation';
import type { Dictionary } from '../../i18n/translations/en';

/**
 * Desktop "Solutions"/"Company" dropdown. Opens on hover (with a short
 * close delay so moving the cursor diagonally into the panel doesn't
 * close it) and on click/Enter/Space for keyboard and touch users.
 * Escape closes and returns focus to the trigger; a click outside the
 * dropdown closes it too.
 */
export function NavDropdown({
  label,
  items,
  language,
  t,
  isOpen,
  onOpenChange,
}: {
  label: string;
  items: NavItem[];
  language: string;
  t: Dictionary;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  const isActive = items.some((item) => location.pathname === `/${language}${item.path}`);

  useEffect(() => {
    if (!isOpen) return;
    function onDocPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [isOpen, onOpenChange]);

  function openNow() {
    window.clearTimeout(closeTimer.current);
    onOpenChange(true);
  }

  function closeWithDelay() {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => onOpenChange(false), 150);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onOpenChange(false);
      triggerRef.current?.focus();
    }
  }

  function onBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      onOpenChange(false);
    }
  }

  return (
    <div className="navDrop" ref={containerRef} onMouseEnter={openNow} onMouseLeave={closeWithDelay} onKeyDown={onKeyDown} onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        className={isActive ? 'navDropTrigger active' : 'navDropTrigger'}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => onOpenChange(!isOpen)}
      >
        {label}
        <ChevronIcon className={isOpen ? 'navDropChevron open' : 'navDropChevron'} />
      </button>
      {/* Always in the DOM -- including the prerendered HTML -- so these links are discoverable
          without a click; .navDropPanel defaults to display:none and only .open shows it. */}
      <div className={isOpen ? 'navDropPanel open' : 'navDropPanel'} role="menu" aria-label={label}>
        {items.map((item) => (
          <NavLink
            key={item.path}
            role="menuitem"
            to={`/${language}${item.path}`}
            onClick={() => onOpenChange(false)}
          >
            {t[item.labelKey]}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
