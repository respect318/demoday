import { X, Terminal } from 'lucide-react';

interface SessionTab {
  sessionId: string;
  label: string;
}

interface SessionTabsProps {
  tabs: SessionTab[];
  activeTab: string;
  onSelect: (sessionId: string) => void;
  onClose: (sessionId: string) => void;
}

export default function SessionTabs({ tabs, activeTab, onSelect, onClose }: SessionTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-surface border-b border-border px-2 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.sessionId}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-mono cursor-pointer transition-colors border-b-2 ${
            activeTab === tab.sessionId
              ? 'border-accent-green text-accent-green bg-background'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
          onClick={() => onSelect(tab.sessionId)}
        >
          <Terminal className="w-3 h-3" />
          <span>{tab.label || tab.sessionId.slice(0, 8)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(tab.sessionId);
            }}
            className="ml-1 hover:text-danger"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
