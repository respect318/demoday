import pytest
from app.core.payload_engine import generate_payload, get_templates


def test_get_templates():
    templates = get_templates()
    assert len(templates) > 0
    assert all("id" in t and "name" in t for t in templates)


def test_get_templates_filtered():
    win = get_templates(os_filter="windows")
    assert all(t["os"] == "windows" for t in win)

    lin = get_templates(os_filter="linux")
    assert all(t["os"] == "linux" for t in lin)


def test_generate_windows_tcp():
    payload = generate_payload("windows", "tcp", "10.0.0.1", 4444)
    assert "10.0.0.1" in payload
    assert "4444" in payload
    assert "powershell" in payload.lower() or "TCPClient" in payload


def test_generate_linux_tcp():
    payload = generate_payload("linux", "tcp", "192.168.1.1", 9999)
    assert "192.168.1.1" in payload
    assert "9999" in payload


def test_generate_linux_netcat():
    payload = generate_payload("linux", "netcat", "10.10.10.10", 5555)
    assert "10.10.10.10" in payload
    assert "5555" in payload
    assert "nc" in payload or "mkfifo" in payload


def test_generate_encoded():
    payload = generate_payload("windows", "tcp", "10.0.0.1", 4444, encode=True)
    assert "-enc" in payload


def test_generate_with_template():
    payload = generate_payload("linux", "tcp", "10.0.0.1", 1234, template="linux_python")
    assert "python" in payload.lower()
    assert "10.0.0.1" in payload
