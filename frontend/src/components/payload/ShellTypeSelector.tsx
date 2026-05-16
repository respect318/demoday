interface ShellTypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
  osType: string;
}

const shellTypes: Record<string, { label: string; os: string[] }> = {
  tcp: { label: 'TCP Reverse', os: ['windows', 'linux'] },
  hoaxshell: { label: 'HoaxShell', os: ['windows'] },
  netcat: { label: 'Netcat', os: ['linux'] },
  powershell: { label: 'PowerShell', os: ['windows'] },
};

export default function ShellTypeSelector({ value, onChange, osType }: ShellTypeSelectorProps) {
  const available = Object.entries(shellTypes).filter(([_, v]) => v.os.includes(osType));

  return (
    <div>
      <label className="block text-sm font-medium text-text-muted mb-1.5">Shell Type</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field w-full"
      >
        {available.map(([key, val]) => (
          <option key={key} value={key}>{val.label}</option>
        ))}
      </select>
    </div>
  );
}
