import { Monitor, Terminal } from 'lucide-react';

interface SessionBadgeProps {
  osType: string;
  shellType: string;
}

export default function SessionBadge({ osType, shellType }: SessionBadgeProps) {
  const isWindows = osType === 'windows';

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        isWindows ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'
      }`}>
        {isWindows ? <Monitor className="w-3 h-3" /> : <Terminal className="w-3 h-3" />}
        {osType}
      </span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        shellType === 'hoaxshell'
          ? 'border border-accent-purple/30 text-accent-purple'
          : 'bg-accent-green/10 text-accent-green'
      }`}>
        {shellType}
      </span>
    </div>
  );
}
