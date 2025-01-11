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

class SliderConfig(BaseModel):
    steps: List[str]  # List of predefined values like ["Mon", "Tue", "Wed"] or ["1", "2", "3", "4", "5"]
    defaultValue: str  # Default selected value

    def dict(self, *args, **kwargs):
        return {
            "steps": self.steps,
            "defaultValue": self.defaultValue
        }

class FieldOptions(BaseModel):
    type: str
    options: Optional[List[str]] = None
    required: bool = False
    subQuestions: Optional[Dict[str, List[SubQuestion]]] = None
    sliderConfig: Optional[SliderConfig] = None

    def dict(self, *args, **kwargs):
        d = super().dict(*args, **kwargs)
        # Remove None values
        return {k: v for k, v in d.items() if v is not None}

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