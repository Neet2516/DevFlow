import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import TableOfContents, { TocItem } from './TableOfContents';

// ── TOC context so child pages can register their headings ───
export const TocContext = React.createContext<{
  items: TocItem[];
  setItems: (items: TocItem[]) => void;
}>({ items: [], setItems: () => {} });

const DocsLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const location = useLocation();

  // Close mobile menu on route change
  React.useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <TocContext.Provider value={{ items: tocItems, setItems: setTocItems }}>
      <div className="min-h-screen flex flex-col">
        <Header onMenuToggle={() => setMobileOpen(o => !o)} mobileMenuOpen={mobileOpen} />

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile sidebar drawer */}
        <div className={`
          fixed top-14 left-0 bottom-0 z-40 w-72 overflow-y-auto
          bg-white dark:bg-[#13161f] border-r border-slate-200 dark:border-slate-800
          transform transition-transform duration-300 lg:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="px-4 py-4">
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 pt-14">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13161f]">
            <div className="px-4">
              <Sidebar />
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 min-w-0">
            <div className="flex justify-between">
              <div className="flex-1 min-w-0 max-w-3xl mx-auto px-6 py-10">
                <Outlet />
              </div>
              <TableOfContents items={tocItems} />
            </div>
          </main>
        </div>
      </div>
    </TocContext.Provider>
  );
};

export default DocsLayout;
