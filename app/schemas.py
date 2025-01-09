from pydantic import BaseModel, UUID4
from typing import Optional, Dict, Any, List
from datetime import datetime

class FormBase(BaseModel):
    title: str
    fields: Dict[str, Any]
    password: Optional[str] = None
    expiry: Optional[datetime] = None

class FormCreate(FormBase):
    pass

class Form(FormBase):
    uuid: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FormResponse(BaseModel):
    uuid: UUID4

class ResponseBase(BaseModel):
    response_data: Dict[str, Any]

class ResponseCreate(ResponseBase):
    pass

class Response(ResponseBase):
    id: UUID4
    form_uuid: UUID4
    created_at: datetime

    class Config:
        from_attributes = True 