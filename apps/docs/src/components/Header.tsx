import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Github, Search, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SearchModal from './SearchModal';

interface HeaderProps {
  onMenuToggle: () => void;
  mobileMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, mobileMenuOpen }) => {
  const { theme, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut for search
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className="header">
        <div className="flex items-center h-full px-4 gap-3">

          {/* Mobile menu toggle */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-1.5 rounded-md text-neutral-500 hover:text-neutral-900
                       dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Text-only Logo (No logo icon) */}
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 mr-2 hover:opacity-80 transition-opacity"
          >
            <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text)' }}>
              DevFlow
            </span>
            <span className="hidden sm:inline text-xs font-mono" style={{ color: 'var(--text-muted)' }}>/</span>
            <span className="hidden sm:inline text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              docs
            </span>
          </Link>

          {/* Version badge */}
          <span className="hidden md:inline-flex items-center rounded-full border border-[var(--border)]
                           px-2.5 py-0.5 text-xs font-mono font-medium"
                style={{ color: 'var(--text-muted)' }}>
            v1.0.0
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono
                       bg-[var(--code-bg)] border border-[var(--border)]
                       hover:border-[var(--text)] transition-colors"
            style={{ color: 'var(--text-muted)' }}
            id="header-search-btn"
          >
            <Search size={13} />
            <span className="hidden sm:inline">Search docs...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]
                            bg-[var(--bg)] border border-[var(--border)] font-mono">
              ⌘K
            </kbd>
          </button>

          {/* GitHub */}
          <a
            href="https://github.com/Neet2516/DevFlow"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="GitHub repository"
          >
            <Github size={18} />
          </a>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Toggle theme"
            id="theme-toggle"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(href) => { setSearchOpen(false); navigate(href); }}
      />
    </>
  );
};

export default Header;
