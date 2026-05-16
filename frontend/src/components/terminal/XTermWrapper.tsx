import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import '../../styles/terminal.css';

interface XTermWrapperProps {
  sessionId: string;
}

export default function XTermWrapper({ sessionId }: XTermWrapperProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!termRef.current) return;

    const terminal = new Terminal({
      theme: {
        background: '#0a0a0f',
        foreground: '#00ff88',
        cursor: '#00ff88',
        cursorAccent: '#0a0a0f',
        selectionBackground: 'rgba(0, 255, 136, 0.2)',
        black: '#0a0a0f',
        green: '#00ff88',
        brightGreen: '#00ff88',
      },
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(termRef.current);
    fitAddon.fit();
    terminalRef.current = terminal;

    terminal.writeln('\x1b[32m[VillainUI]\x1b[0m Connecting to session ' + sessionId + '...');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/shell/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      terminal.writeln('\x1b[32m[VillainUI]\x1b[0m Connected.\r\n');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'output') {
          terminal.write(msg.data);
        } else if (msg.type === 'session_defender_warn') {
          setWarning(msg.data);
        } else if (msg.type === 'session_info') {
          terminal.writeln(`\x1b[36mSession: ${msg.data.session_id} | IP: ${msg.data.ip_address} | OS: ${msg.data.os_type}\x1b[0m\r\n`);
        } else if (msg.type === 'error') {
          terminal.writeln(`\x1b[31m${msg.data}\x1b[0m\r\n`);
        }
      } catch {
        terminal.write(event.data);
      }
    };

    ws.onclose = () => {
      terminal.writeln('\r\n\x1b[31m[VillainUI]\x1b[0m Connection closed.');
    };

    let inputBuffer = '';
    terminal.onData((data) => {
      if (data === '\r') {
        ws.send(JSON.stringify({ type: 'input', data: inputBuffer }));
        inputBuffer = '';
        terminal.write('\r\n');
      } else if (data === '\x7f') {
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          terminal.write('\b \b');
        }
      } else {
        inputBuffer += data;
        terminal.write(data);
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.onclose = null;
      ws.close();
      terminal.dispose();
    };
  }, [sessionId]);

  return (
    <div className="terminal-wrapper h-full">
      {warning && (
        <div className="session-defender-warn">
          <span>&#9888;</span>
          <span>{warning}</span>
          <button onClick={() => setWarning(null)}>&times;</button>
        </div>
      )}
      <div className="terminal-body">
        <div ref={termRef} className="xterm-container" />
      </div>
    </div>
  );
}
