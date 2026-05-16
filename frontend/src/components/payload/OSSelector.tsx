import { Monitor, Terminal } from 'lucide-react';

interface OSSelectorProps {
  value: string;
  onChange: (os: string) => void;
}

export default function OSSelector({ value, onChange }: OSSelectorProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange('windows')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
          value === 'windows'
            ? 'border-blue-400 bg-blue-400/10 text-blue-400'
            : 'border-border text-text-muted hover:border-text-muted'
        }`}
      >
        <Monitor className="w-5 h-5" />
        <span className="font-medium">Windows</span>
      </button>
      <button
        onClick={() => onChange('linux')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
          value === 'linux'
            ? 'border-orange-400 bg-orange-400/10 text-orange-400'
            : 'border-border text-text-muted hover:border-text-muted'
        }`}
      >
        <Terminal className="w-5 h-5" />
        <span className="font-medium">Linux</span>
      </button>
    </div>
  );
}
