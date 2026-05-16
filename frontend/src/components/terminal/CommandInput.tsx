import { useState } from 'react';
import { Send } from 'lucide-react';

interface CommandInputProps {
  onSend: (command: string) => void;
  disabled?: boolean;
}

export default function CommandInput({ onSend, disabled }: CommandInputProps) {
  const [command, setCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      onSend(command.trim());
      setCommand('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 bg-surface border-t border-border">
      <span className="text-accent-green font-mono text-sm">$</span>
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        className="flex-1 bg-transparent text-text-primary font-mono text-sm outline-none placeholder:text-text-muted"
        placeholder="Type command..."
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || !command.trim()}
        className="p-1.5 text-accent-green hover:bg-accent-green/10 rounded transition-colors disabled:opacity-30"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
