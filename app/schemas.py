from pydantic import BaseModel
from typing import Dict, Optional, List, Any, Union
from datetime import datetime

class FormBase(BaseModel):
    title: str
    fields: Dict[str, Optional[Union[List[str], str]]]
    password: Optional[str] = None

class FormCreate(FormBase):
    pass

class FormResponse(BaseModel):
    uuid: str

class Form(FormBase):
    uuid: str
    created_at: datetime

    class Config:
        from_attributes = True

class ResponseCreate(BaseModel):
    response_data: Dict[str, Any]

class Response(ResponseCreate):
    id: str
    form_uuid: str
    created_at: datetime

    class Config:
        from_attributes = True

class ViewResponsesResponse(BaseModel):
    title: str
    fields: List[str]
    responses: List[Dict[str, Any]]

    class Config:
        from_attributes = True 