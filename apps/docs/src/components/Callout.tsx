import React from 'react';
import { Info, Lightbulb, AlertTriangle, AlertCircle } from 'lucide-react';

type CalloutType = 'note' | 'tip' | 'warning' | 'danger' | 'important';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const config: Record<CalloutType, { icon: React.ReactNode; label: string; cls: string }> = {
  note:      { icon: <Info size={16} />,          label: 'Note',      cls: 'callout-note' },
  tip:       { icon: <Lightbulb size={16} />,     label: 'Tip',       cls: 'callout-tip' },
  warning:   { icon: <AlertTriangle size={16} />, label: 'Warning',   cls: 'callout-warn' },
  danger:    { icon: <AlertCircle size={16} />,   label: 'Important', cls: 'callout-danger' },
  important: { icon: <AlertCircle size={16} />,   label: 'Important', cls: 'callout-danger' },
};

const Callout: React.FC<CalloutProps> = ({ type = 'note', title, children }) => {
  const { icon, label, cls } = config[type];
  return (
    <div className={`callout ${cls}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-semibold mb-0.5">{title ?? label}</p>
        <div className="text-[0.875em] leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

export default Callout;
