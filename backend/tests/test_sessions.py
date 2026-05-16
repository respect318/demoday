import pytest
from app.core.session_manager import SessionManager


def test_add_session():
    mgr = SessionManager()
    session = mgr.add_session("abc-123", "192.168.1.10", "windows", "tcp")
    assert session.session_id == "abc-123"
    assert session.ip_address == "192.168.1.10"
    assert session.os_type == "windows"
    assert session.alive is True
    assert len(mgr.get_all()) == 1


def test_remove_session():
    mgr = SessionManager()
    mgr.add_session("abc-123", "192.168.1.10", "linux", "netcat")
    removed = mgr.remove_session("abc-123")
    assert removed is not None
    assert removed.alive is False
    assert len(mgr.get_all()) == 0


def test_parse_new_session():
    mgr = SessionManager()
    line = "New session abc12345-6789-0000-aaaa-bbbbccccdddd from 10.0.0.5 (windows tcp)"
    event = mgr.parse_line(line)
    assert event is not None
    assert event["type"] == "new_session"
    assert event["data"]["session_id"] == "abc12345-6789-0000-aaaa-bbbbccccdddd"
    assert event["data"]["ip_address"] == "10.0.0.5"


def test_parse_session_died():
    mgr = SessionManager()
    mgr.add_session("abc12345-dead-0000-aaaa-bbbbccccdddd", "10.0.0.5", "linux", "tcp")
    line = "Session abc12345-dead-0000-aaaa-bbbbccccdddd died"
    event = mgr.parse_line(line)
    assert event is not None
    assert event["type"] == "session_died"


def test_set_alias():
    mgr = SessionManager()
    mgr.add_session("sess-001", "10.0.0.1", "linux", "tcp")
    assert mgr.set_alias("sess-001", "target-box")
    session = mgr.get("sess-001")
    assert session.alias == "target-box"


def test_session_defender():
    from app.core.session_defender import check_command

    assert check_command("whoami") is None
    assert check_command("ls -la") is None
    assert check_command("python") is not None
    assert check_command("vim /etc/passwd") is not None
    assert check_command("python3 -c 'print(1)'") is None
    assert check_command("nano") is not None
    assert check_command("ssh user@host") is not None
