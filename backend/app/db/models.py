from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(Text, nullable=False)
    role = Column(String(50), default="operator")
    must_change_password = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SessionRecord(Base):
    __tablename__ = "session_records"

    id = Column(String(100), primary_key=True)
    alias = Column(String(150), nullable=True)
    ip_address = Column(String(45), nullable=False)
    os_type = Column(String(20), nullable=False)
    shell_type = Column(String(30), nullable=False)
    sibling_id = Column(String(100), nullable=True)
    connected_at = Column(DateTime, default=datetime.utcnow)
    disconnected_at = Column(DateTime, nullable=True)


class CommandLog(Base):
    __tablename__ = "command_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), ForeignKey("session_records.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    command = Column(Text, nullable=False)
    output = Column(Text, nullable=True)
    flagged = Column(Boolean, default=False)
    executed_at = Column(DateTime, default=datetime.utcnow)


class PayloadHistory(Base):
    __tablename__ = "payload_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template = Column(String(200), nullable=True)
    os_type = Column(String(20), nullable=False)
    shell_type = Column(String(30), nullable=False)
    lhost = Column(String(45), nullable=False)
    lport = Column(Integer, nullable=False)
    payload = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(500), nullable=False)
    size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
