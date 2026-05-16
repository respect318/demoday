import { useState } from 'react';
import { Zap } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import OSSelector from '../components/payload/OSSelector';
import ShellTypeSelector from '../components/payload/ShellTypeSelector';
import PayloadOutput from '../components/payload/PayloadOutput';
import { usePayloadBuilder } from '../hooks/usePayloadBuilder';
import { formatDistanceToNow } from 'date-fns';

export default function PayloadBuilder() {
  const [osType, setOsType] = useState('windows');
  const [shellType, setShellType] = useState('tcp');
  const [lhost, setLhost] = useState('');
  const [lport, setLport] = useState(4444);
  const [template, setTemplate] = useState('');
  const [encode, setEncode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { templates, history, generated, loading, error, generate, loadTemplates } = usePayloadBuilder();

  const handleOsChange = (os: string) => {
    setOsType(os);
    setShellType('tcp');
    loadTemplates(os);
  };

  const handleGenerate = () => {
    generate({ os_type: osType, shell_type: shellType, lhost, lport, template: template || undefined, encode });
  };

  return (
    <div>
      <TopBar title="Payload Builder" />
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="card space-y-5">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-green" /> Configuration
            </h3>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Target OS</label>
              <OSSelector value={osType} onChange={handleOsChange} />
            </div>

            <ShellTypeSelector value={shellType} onChange={setShellType} osType={osType} />

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">LHOST</label>
              <input
                type="text"
                value={lhost}
                onChange={(e) => setLhost(e.target.value)}
                className="input-field w-full"
                placeholder="e.g. 10.0.0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">LPORT</label>
              <input
                type="number"
                value={lport}
                onChange={(e) => setLport(Number(e.target.value))}
                className="input-field w-full"
                min={1}
                max={65535}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Template</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Auto-select</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={encode}
                  onChange={(e) => setEncode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-border peer-focus:ring-2 peer-focus:ring-accent-green/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-muted after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-green peer-checked:after:bg-background" />
              </label>
              <span className="text-sm text-text-muted">Encode payload</span>
            </div>

            {error && <div className="text-danger text-sm">{error}</div>}

            <button onClick={handleGenerate} disabled={loading || !lhost} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Generating...' : 'Generate Payload'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="card">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Generated Payload</h3>
              <PayloadOutput payload={generated?.payload || null} />
            </div>

            <div className="card">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between text-sm font-semibold text-text-primary"
              >
                <span>Payload History ({history.length})</span>
                <span className="text-text-muted">{showHistory ? '▲' : '▼'}</span>
              </button>
              {showHistory && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {history.slice(0, 10).map((h) => (
                    <div key={h.id} className="p-2 bg-background rounded text-xs">
                      <div className="flex justify-between text-text-muted mb-1">
                        <span>{h.os_type}/{h.shell_type}</span>
                        <span>{formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}</span>
                      </div>
                      <pre className="text-accent-green truncate">{h.payload}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
