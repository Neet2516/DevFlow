import React, { useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TocContext } from './DocsLayout';
import { TocItem } from './TableOfContents';
import Breadcrumbs from './Breadcrumbs';
import Pagination from './Pagination';

interface DocPageProps {
  title: string;
  description?: string;
  toc?: TocItem[];
  children: React.ReactNode;
}

const DocPage: React.FC<DocPageProps> = ({ title, description, toc = [], children }) => {
  const { setItems } = useContext(TocContext);
  const { pathname } = useLocation();

  useEffect(() => {
    setItems(toc);
    document.title = `${title} — DevFlow Docs`;
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <article>
      <Breadcrumbs />
      <div className="prose">
        <h1>{title}</h1>
        {description && <p className="text-lg text-slate-500 dark:text-slate-400 mt-1 mb-8 leading-relaxed">{description}</p>}
        {children}
      </div>
      <Pagination currentPath={pathname} />
    </article>
  );
};

export default DocPage;
