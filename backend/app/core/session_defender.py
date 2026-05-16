import re
from typing import Optional

DANGEROUS_COMMANDS = [
    r"^\s*vim\b",
    r"^\s*vi\b",
    r"^\s*nano\b",
    r"^\s*emacs\b",
    r"^\s*ssh\b",
    r"^\s*su\b",
    r"^\s*sudo\s+su\b",
    r"^\s*python3?\s*$",
    r"^\s*python3?\s+-i",
    r"^\s*irb\s*$",
    r"^\s*node\s*$",
    r"^\s*mysql\s*$",
    r"^\s*psql\s*$",
    r"^\s*mongo\s*$",
    r"^\s*ftp\s*$",
    r"^\s*telnet\b",
    r"^\s*ncat\b.*-e",
    r"^\s*less\b",
    r"^\s*more\b",
    r"^\s*top\s*$",
    r"^\s*htop\s*$",
    r"^\s*man\b",
    r"^\s*screen\b",
    r"^\s*tmux\b",
    r"^\s*docker\s+exec\s+-it",
    r"^\s*bash\s*$",
    r"^\s*sh\s*$",
    r"^\s*zsh\s*$",
    r"^\s*powershell\s*$",
    r"^\s*cmd\s*$",
]

DANGEROUS_PATTERNS = [re.compile(p, re.IGNORECASE) for p in DANGEROUS_COMMANDS]


def check_command(command: str) -> Optional[str]:
    """
    Check if a command could cause the shell to hang.
    Returns a warning string if dangerous, None if safe.
    """
    cmd = command.strip()
    if not cmd:
        return None

    for pattern in DANGEROUS_PATTERNS:
        if pattern.search(cmd):
            return (
                f"Warning: The command '{cmd.split()[0]}' may open an interactive "
                f"sub-process that could cause the shell to hang. "
                f"Consider using non-interactive alternatives or adding appropriate flags."
            )

    return None
