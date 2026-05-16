import os
import sys
import asyncio
import subprocess
import signal
from typing import Optional
from collections import deque

from app.config import settings
from app.utils.logger import get_logger
from app.core.session_manager import session_manager

logger = get_logger("villain_bridge")

IS_WINDOWS = sys.platform == "win32"


class VillainBridge:
    """
    Core bridge that launches the Villain C2 framework as a subprocess,
    captures stdout/stderr asynchronously, relays output to WebSocket clients,
    and writes commands from the browser terminal to Villain's stdin.
    """

    def __init__(self):
        self._process: Optional[asyncio.subprocess.Process] = None
        self._running: bool = False
        self._log_buffer: deque = deque(maxlen=2000)
        self._output_callbacks = []
        self._event_callbacks = []
        self._reader_task: Optional[asyncio.Task] = None
        self._stderr_task: Optional[asyncio.Task] = None

    @property
    def running(self) -> bool:
        return self._running and self._process is not None and self._process.returncode is None

    @property
    def pid(self) -> Optional[int]:
        return self._process.pid if self._process else None

    @property
    def log_buffer(self) -> list:
        return list(self._log_buffer)

    def on_output(self, callback):
        self._output_callbacks.append(callback)

    def on_event(self, callback):
        self._event_callbacks.append(callback)

    def remove_output_callback(self, callback):
        if callback in self._output_callbacks:
            self._output_callbacks.remove(callback)

    def remove_event_callback(self, callback):
        if callback in self._event_callbacks:
            self._event_callbacks.remove(callback)

    async def _notify_output(self, data: str):
        for cb in self._output_callbacks:
            try:
                await cb(data)
            except Exception as e:
                logger.error(f"Output callback error: {e}")

    async def _notify_event(self, event: dict):
        for cb in self._event_callbacks:
            try:
                await cb(event)
            except Exception as e:
                logger.error(f"Event callback error: {e}")

    async def start(self) -> bool:
        if self.running:
            logger.warning("Villain is already running")
            return False

        villain_path = settings.VILLAIN_PATH
        villain_main = os.path.join(villain_path, "Villain.py")

        if not os.path.exists(villain_main):
            logger.error(f"Villain.py not found at {villain_main}")
            self._log_buffer.append(f"[ERROR] Villain.py not found at {villain_main}")
            self._log_buffer.append("[INFO] Villain submodule may not be initialized. Run: git submodule update --init")
            await self._notify_output(f"[ERROR] Villain.py not found at {villain_main}\n")
            return False

        cmd = [
            sys.executable, villain_main,
            "-p", str(settings.TCP_PORT),
            "-x", str(settings.HOAXSHELL_PORT),
            "-n", str(settings.NETCAT_PORT),
            "-f", str(settings.FILE_SMUGGLER_PORT),
        ]

        if settings.SSL_CERTFILE and settings.SSL_KEYFILE:
            cmd.extend(["-c", settings.SSL_CERTFILE, "-k", settings.SSL_KEYFILE])

        try:
            logger.info(f"Starting Villain: {' '.join(cmd)}")
            self._log_buffer.append(f"[INFO] Starting Villain daemon...")

            if IS_WINDOWS:
                self._process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=villain_path,
                )
            else:
                self._process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=villain_path,
                )

            self._running = True
            self._reader_task = asyncio.create_task(self._read_stdout())
            self._stderr_task = asyncio.create_task(self._read_stderr())

            logger.info(f"Villain started with PID {self._process.pid}")
            self._log_buffer.append(f"[INFO] Villain started (PID: {self._process.pid})")
            await self._notify_output(f"[INFO] Villain started (PID: {self._process.pid})\n")
            await self._notify_event({"type": "daemon_status", "data": {"status": "running", "pid": self._process.pid}})
            return True

        except Exception as e:
            logger.error(f"Failed to start Villain: {e}")
            self._log_buffer.append(f"[ERROR] Failed to start Villain: {e}")
            await self._notify_output(f"[ERROR] Failed to start Villain: {e}\n")
            self._running = False
            return False

    async def stop(self) -> bool:
        if not self.running:
            logger.warning("Villain is not running")
            return False

        try:
            self._running = False

            if self._process:
                try:
                    self._process.stdin.write(b"exit\n")
                    await self._process.stdin.drain()
                except Exception:
                    pass

                await asyncio.sleep(1)

                if self._process.returncode is None:
                    self._process.terminate()
                    try:
                        await asyncio.wait_for(self._process.wait(), timeout=5)
                    except asyncio.TimeoutError:
                        self._process.kill()
                        await self._process.wait()

            if self._reader_task:
                self._reader_task.cancel()
            if self._stderr_task:
                self._stderr_task.cancel()

            logger.info("Villain stopped")
            self._log_buffer.append("[INFO] Villain daemon stopped")
            await self._notify_output("[INFO] Villain daemon stopped\n")
            await self._notify_event({"type": "daemon_status", "data": {"status": "stopped", "pid": None}})
            self._process = None
            return True

        except Exception as e:
            logger.error(f"Error stopping Villain: {e}")
            self._process = None
            return False

    async def send_command(self, command: str):
        if not self.running or not self._process or not self._process.stdin:
            logger.warning("Cannot send command: Villain not running")
            return False

        try:
            cmd_bytes = (command + "\n").encode()
            self._process.stdin.write(cmd_bytes)
            await self._process.stdin.drain()
            self._log_buffer.append(f">>> {command}")
            return True
        except Exception as e:
            logger.error(f"Error sending command: {e}")
            return False

    async def _read_stdout(self):
        try:
            while self._running and self._process and self._process.stdout:
                line_bytes = await self._process.stdout.readline()
                if not line_bytes:
                    if self._process.returncode is not None:
                        break
                    await asyncio.sleep(0.1)
                    continue

                line = line_bytes.decode("utf-8", errors="replace").rstrip("\n\r")
                self._log_buffer.append(line)
                await self._notify_output(line + "\n")

                event = session_manager.parse_line(line)
                if event:
                    await self._notify_event(event)
                    await self._notify_output(f"[EVENT] {event['type']}: {event['data']}\n")

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"stdout reader error: {e}")
        finally:
            if self._running:
                self._running = False
                self._log_buffer.append("[WARN] Villain process exited unexpectedly")
                await self._notify_output("[WARN] Villain process exited unexpectedly\n")
                await self._notify_event({"type": "daemon_status", "data": {"status": "crashed", "pid": None}})

    async def _read_stderr(self):
        try:
            while self._running and self._process and self._process.stderr:
                line_bytes = await self._process.stderr.readline()
                if not line_bytes:
                    if self._process.returncode is not None:
                        break
                    await asyncio.sleep(0.1)
                    continue

                line = line_bytes.decode("utf-8", errors="replace").rstrip("\n\r")
                self._log_buffer.append(f"[STDERR] {line}")
                await self._notify_output(f"[STDERR] {line}\n")

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"stderr reader error: {e}")


villain_bridge = VillainBridge()
