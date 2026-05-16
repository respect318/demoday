import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface PayloadOutputProps {
  payload: string | null;
}

export default function PayloadOutput({ payload }: PayloadOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (payload) {
      navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!payload) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted text-sm border border-dashed border-border rounded-lg p-8">
        Generated payload will appear here
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-medium hover:bg-border transition-colors"
        >
          {copied ? (
            <><Check className="w-3 h-3 text-accent-green" /> Copied!</>
          ) : (
            <><Copy className="w-3 h-3" /> Copy</>
          )}
        </button>
      </div>
      <pre className="bg-background border border-border rounded-lg p-4 pt-10 overflow-x-auto text-sm font-mono text-accent-green leading-relaxed whitespace-pre-wrap break-all">
        {payload.split('\n').map((line, i) => (
          <div key={i} className="flex">
            <span className="select-none text-text-muted w-8 text-right mr-4 shrink-0">{i + 1}</span>
            <span>{line}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
