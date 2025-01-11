from pydantic import BaseModel
from typing import Dict, Optional, List, Any, Union
from datetime import datetime

class SubQuestion(BaseModel):
    name: str
    type: str
    options: List[str] = []

class FieldOptions(BaseModel):
    options: List[str]
    subQuestions: Dict[str, List[SubQuestion]]

class FormBase(BaseModel):
    title: str
    fields: Dict[str, Optional[Union[List[str], str, FieldOptions]]]
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

class ResponseData(BaseModel):
    value: Any
    subResponses: Optional[Dict[str, Any]] = None

class ResponseCreate(BaseModel):
    response_data: Dict[str, ResponseData]

class Response(ResponseCreate):
    id: str
    form_uuid: str
    created_at: datetime

    class Config:
        from_attributes = True

class ViewResponsesResponse(BaseModel):
    title: str
    fields: Dict[str, Any]
    responses: List[Dict[str, Any]]

    class Config:
        from_attributes = True 