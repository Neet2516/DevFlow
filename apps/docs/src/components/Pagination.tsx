import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { allNavItems } from '../data/nav';

interface PaginationProps {
  currentPath: string;
}

const Pagination: React.FC<PaginationProps> = ({ currentPath }) => {
  const idx = allNavItems.findIndex(item => item.href === currentPath);
  const prev = idx > 0 ? allNavItems[idx - 1] : null;
  const next = idx < allNavItems.length - 1 ? allNavItems[idx + 1] : null;

  if (!prev && !next) return null;

  return (
    <div className="flex items-center justify-between mt-12 pt-6
                    border-t border-slate-200 dark:border-slate-800">
      {prev ? (
        <Link
          to={prev.href}
          className="group flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400
                     hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>{prev.title}</span>
        </Link>
      ) : <span />}

      {next ? (
        <Link
          to={next.href}
          className="group flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400
                     hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <span>{next.title}</span>
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      ) : <span />}
    </div>
  );
};

export default Pagination;
