import React, { useState, useEffect, useRef } from 'react';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ items }) => {
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const headings = items
      .map(item => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-14px 0% -85% 0%', threshold: 0 }
    );

    headings.forEach(h => observerRef.current?.observe(h));
    return () => observerRef.current?.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pl-4 hidden xl:block border-l border-[var(--border)]">
      <h3 className="text-sm font-bold text-[var(--text)] mb-3 tracking-tight">
        In this article
      </h3>
      <nav>
        <ul className="space-y-1.5 border-l border-[var(--border)] pl-2">
          {items.map(item => (
            <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 8}px` }}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                  setActiveId(item.id);
                }}
                className={`block text-xs transition-colors py-0.5 ${
                  activeId === item.id
                    ? 'text-[var(--text)] font-semibold border-l-2 border-[var(--text)] -ml-[9px] pl-[7px]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default TableOfContents;
