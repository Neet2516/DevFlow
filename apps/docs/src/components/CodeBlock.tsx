import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  terminal?: boolean;
}

// Very simple syntax highlighting using CSS classes
const highlight = (code: string, lang: string): string => {
  if (lang === 'bash' || lang === 'sh' || lang === 'shell') {
    return code
      .replace(/(^|\n)(#[^\n]*)/g, '$1<span class="text-slate-500">$2</span>')
      .replace(/\b(npm|npx|docker|git|cd|cp|curl)\b/g, '<span class="text-brand-400">$1</span>')
      .replace(/(--[\w-]+)/g, '<span class="text-violet-400">$1</span>');
  }
  if (lang === 'json') {
    return code
      .replace(/"([^"]+)":/g, '<span class="text-blue-400">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span class="text-green-400">"$1"</span>')
      .replace(/: (\d+|true|false|null)/g, ': <span class="text-amber-400">$1</span>');
  }
  if (lang === 'typescript' || lang === 'ts' || lang === 'js' || lang === 'javascript') {
    return code
      .replace(/(\/\/[^\n]*)/g, '<span class="text-slate-500">$1</span>')
      .replace(/\b(const|let|var|function|class|interface|type|import|export|from|return|async|await|new|extends|implements)\b/g,
        '<span class="text-violet-400">$1</span>')
      .replace(/"([^"]*)"/g, '<span class="text-green-400">"$1"</span>');
  }
  return code;
};

const LANG_LABELS: Record<string, string> = {
  bash: 'bash', sh: 'shell', shell: 'shell',
  json: 'json', ts: 'typescript', typescript: 'typescript',
  js: 'javascript', javascript: 'javascript',
  yml: 'yaml', yaml: 'yaml', env: '.env',
  sql: 'sql', mermaid: 'diagram',
};

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'bash', filename, terminal = false }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  const label = LANG_LABELS[language] || language;
  const highlighted = highlight(code, language);

  return (
    <div className="code-block">
      <div className="code-block-header">
        <div className="flex items-center gap-2">
          {terminal && <Terminal size={13} className="text-slate-400" />}
          {filename
            ? <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{filename}</span>
            : <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
          }
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200
                     transition-colors px-2 py-1 rounded hover:bg-white/10"
          aria-label="Copy code"
        >
          {copied
            ? <><Check size={13} className="text-green-400" /><span className="text-green-400">Copied!</span></>
            : <><Copy size={13} /><span>Copy</span></>
          }
        </button>
      </div>
      <pre>
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
};

export default CodeBlock;
