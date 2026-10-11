import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={isDark ? 'Chuyển sang chế độ sáng (Light Mode)' : 'Chuyển sang chế độ tối (Dark Mode)'}
      aria-label={isDark ? 'Kích hoạt giao diện sáng' : 'Kích hoạt giao diện tối'}
      data-testid="theme-toggle-btn"
    >
      <div className={`theme-toggle-icon-wrap ${isDark ? 'is-dark' : 'is-light'}`}>
        <Sun className="theme-icon sun-icon" size={19} />
        <Moon className="theme-icon moon-icon" size={19} />
      </div>
      <span className="theme-toggle-label sr-only">
        {isDark ? 'Chế độ tối' : 'Chế độ sáng'}
      </span>
    </button>
  );
};

export default ThemeToggle;
