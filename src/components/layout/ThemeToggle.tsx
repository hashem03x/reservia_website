import { useTheme } from '../../theme/ThemeContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { SunIcon, MoonIcon } from '../icons/ThemeIcons';

/**
 * Single shared Light/Dark toggle (state lives in ThemeContext, so this
 * component can be rendered anywhere without creating a second source of
 * truth). Shows the icon for the mode a click will switch *to*, which is
 * why dark-mode shows the sun (click to go light) and light-mode shows
 * the moon (click to go dark).
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const label = theme === 'dark' ? t.theme_to_light : t.theme_to_dark;

  return (
    <button type="button" className="themeToggle" onClick={toggleTheme} aria-label={label} title={label}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
