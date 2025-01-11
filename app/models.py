from sqlalchemy import Column, String, JSON, DateTime, ForeignKey, UUID
from sqlalchemy.sql import func
import uuid
from database import Base

class Form(Base):
    __tablename__ = "forms"

    uuid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String)
    fields = Column(JSON)  # This will store the fields configuration
    password = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Response(Base):
    __tablename__ = "responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    form_uuid = Column(UUID(as_uuid=True), ForeignKey("forms.uuid"))
    response_data = Column(JSON)  # This will store the response data
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 