from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime

class Form(Base):
    __tablename__ = "forms"

    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    fields = Column(JSON, nullable=False)
    password = Column(String, nullable=True)
    expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")

class Response(Base):
    __tablename__ = "responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    form_uuid = Column(UUID(as_uuid=True), ForeignKey("forms.uuid", ondelete="CASCADE"))
    response_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    form = relationship("Form", back_populates="responses") 