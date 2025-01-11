from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Any, Union
from datetime import datetime

class SubQuestion(BaseModel):
    name: str
    type: str
    options: List[str] = []
    required: bool = False

    def dict(self, *args, **kwargs):
        return {
            "name": self.name,
            "type": self.type,
            "options": self.options,
            "required": self.required
        }

class FieldOptions(BaseModel):
    type: str
    options: List[str]
    required: bool = False
    subQuestions: Dict[str, List[SubQuestion]] = {}

    def dict(self, *args, **kwargs):
        return {
            "type": self.type,
            "options": self.options,
            "required": self.required,
            "subQuestions": {
                key: [q.dict() for q in questions]
                for key, questions in self.subQuestions.items()
            }
        }

class FormBase(BaseModel):
    title: str
    fields: Dict[str, Union[FieldOptions, Dict[str, Any]]]
    password: Optional[str] = None

    def dict(self, *args, **kwargs):
        fields_dict = {}
        for key, value in self.fields.items():
            if isinstance(value, FieldOptions):
                fields_dict[key] = value.dict()
            else:
                fields_dict[key] = value
        return {
            "title": self.title,
            "fields": fields_dict,
            "password": self.password
        }

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

    def dict(self, *args, **kwargs):
        return {
            "value": self.value,
            "subResponses": self.subResponses
        }

class ResponseCreate(BaseModel):
    response_data: Dict[str, ResponseData]

    def dict(self, *args, **kwargs):
        return {
            "response_data": {
                key: value.dict() if isinstance(value, ResponseData) else value
                for key, value in self.response_data.items()
            }
        }

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