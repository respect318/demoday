import { useState } from 'react';
import { useParams } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import XTermWrapper from '../components/terminal/XTermWrapper';
import SessionTabs from '../components/terminal/SessionTabs';

export default function ShellTerminal() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [tabs, setTabs] = useState<{ sessionId: string; label: string }[]>(
    sessionId ? [{ sessionId, label: sessionId.slice(0, 12) }] : []
  );
  const [activeTab, setActiveTab] = useState(sessionId || '');

  const handleClose = (id: string) => {
    setTabs((prev) => prev.filter((t) => t.sessionId !== id));
    if (activeTab === id) {
      const remaining = tabs.filter((t) => t.sessionId !== id);
      setActiveTab(remaining.length > 0 ? remaining[0].sessionId : '');
    }
  };

  if (!activeTab) {
    return (
      <div>
        <TopBar title="Shell Terminal" />
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] text-text-muted">
          No session selected. Open a terminal from the Sessions page.
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <TopBar title="Shell Terminal" />
      <SessionTabs
        tabs={tabs}
        activeTab={activeTab}
        onSelect={setActiveTab}
        onClose={handleClose}
      />
      <div className="flex-1 overflow-hidden">
        <XTermWrapper sessionId={activeTab} />
      </div>
    </div>
  );
}
