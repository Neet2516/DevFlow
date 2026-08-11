import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Filter, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { navItems } from '../data/nav';

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobile = false, onClose }) => {
  const location = useLocation();
  const [filterText, setFilterText] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const filteredNavItems = navItems.map(section => {
    const matchingItems = section.items.filter(item =>
      item.title.toLowerCase().includes(filterText.toLowerCase()) ||
      section.section.toLowerCase().includes(filterText.toLowerCase())
    );
    return {
      ...section,
      items: matchingItems
    };
  }).filter(section => section.items.length > 0);

  return (
    <nav
      className={
        mobile
          ? 'w-full py-2'
          : 'w-64 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-4 pr-3 border-r border-[var(--border)]'
      }
      aria-label="MDN style documentation navigation"
    >
      {/* Top Sidebar Category Title */}
      <div className="px-2 mb-3">
        <h2 className="text-sm font-bold tracking-tight text-[var(--text)] uppercase">
          DevFlow Engine
        </h2>
      </div>

      {/* MDN-Style Filter Box */}
      <div className="px-2 mb-4">
        <div className="relative flex items-center">
          <Filter size={13} className="absolute left-3 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Filter"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-full
                       bg-[var(--code-bg)] border border-[var(--border)]
                       text-[var(--text)] placeholder-[var(--text-muted)]
                       focus:outline-none focus:border-[var(--text)] transition-all"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="absolute right-2.5 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="space-y-4">
        {filteredNavItems.map((section) => {
          const isCollapsed = Boolean(collapsedSections[section.section]);
          return (
            <div key={section.section} className="space-y-1">
              {/* Section Header with Expand/Collapse toggle */}
              <button
                onClick={() => toggleSection(section.section)}
                className="w-full flex items-center justify-between px-2 py-1 text-[0.72rem] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <span>{section.section}</span>
                {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>

              {/* Section Items */}
              {!isCollapsed && (
                <ul className="space-y-0.5 pl-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.href ||
                      (item.href !== '/docs/introduction' && location.pathname === item.href);

                    return (
                      <li key={item.id}>
                        <NavLink
                          to={item.href}
                          onClick={mobile ? onClose : undefined}
                          className={`sidebar-item group relative ${
                            isActive
                              ? 'active font-semibold text-[var(--bg)] bg-[var(--text)] rounded-md shadow-sm'
                              : 'hover:bg-[var(--code-bg)] text-[var(--text-muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          <ChevronRight
                            size={12}
                            className={`shrink-0 transition-transform ${
                              isActive ? 'text-[var(--bg)] translate-x-0.5' : 'text-[var(--text-muted)] opacity-50 group-hover:opacity-100'
                            }`}
                          />
                          <span className="flex-1 text-xs truncate">{item.title}</span>
                          {item.badge && (
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isActive ? 'bg-[var(--bg)] text-[var(--text)]' : 'bg-[var(--code-bg)] text-[var(--text-muted)] border border-[var(--border)]'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default Sidebar;
