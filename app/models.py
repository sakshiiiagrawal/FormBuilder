from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime

class Form(Base):
    __tablename__ = "forms"

    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    fields = Column(JSONB, nullable=False)
    password = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")

class Response(Base):
    __tablename__ = "responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    form_uuid = Column(UUID(as_uuid=True), ForeignKey("forms.uuid", ondelete="CASCADE"))
    response_data = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    form = relationship("Form", back_populates="responses") 