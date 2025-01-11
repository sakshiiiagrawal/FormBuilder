from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import Union
import models, schemas
from fastapi import HTTPException

def create_form(db: Session, form: schemas.FormCreate):
    form_dict = form.dict()
    db_form = models.Form(
        title=form_dict["title"],
        fields=form_dict["fields"],
        password=form_dict["password"]
    )
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    return {"uuid": str(db_form.uuid)}

def get_form(db: Session, form_uuid: Union[str, uuid.UUID]):
    if isinstance(form_uuid, str):
        try:
            form_uuid = uuid.UUID(form_uuid)
        except ValueError:
            return None
    
    db_form = db.query(models.Form).filter(models.Form.uuid == form_uuid).first()
    if db_form:
        # Convert UUID to string before returning
        db_form.uuid = str(db_form.uuid)
        
        # Process fields to ensure proper structure
        processed_fields = {}
        for field_name, field_config in db_form.fields.items():
            if isinstance(field_config, dict):
                if 'type' in field_config:
                    if field_config['type'] in ['dropdown', 'multiselect']:
                        processed_fields[field_name] = {
                            'type': field_config['type'],
                            'options': field_config.get('options', []),
                            'required': field_config.get('required', False),
                            'subQuestions': field_config.get('subQuestions', {})
                        }
                    else:  # text or image
                        processed_fields[field_name] = {
                            'type': field_config['type'],
                            'required': field_config.get('required', False)
                        }
            else:
                # Legacy format or simple field
                processed_fields[field_name] = {
                    'type': 'text',
                    'required': False
                }
        
        db_form.fields = processed_fields
    return db_form

def create_response(db: Session, form_uuid: Union[str, uuid.UUID], response: schemas.ResponseCreate):
    if isinstance(form_uuid, str):
        try:
            form_uuid = uuid.UUID(form_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid UUID format")

    form = get_form(db, form_uuid)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    response_dict = response.dict()
    db_response = models.Response(
        form_uuid=form_uuid,
        response_data=response_dict["response_data"]
    )
    db.add(db_response)
    db.commit()
    db.refresh(db_response)
    
    # Convert UUIDs to strings
    db_response.id = str(db_response.id)
    db_response.form_uuid = str(db_response.form_uuid)
    return db_response

def get_responses(db: Session, form_uuid: Union[str, uuid.UUID], password: str):
    if isinstance(form_uuid, str):
        try:
            form_uuid = uuid.UUID(form_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid UUID format")
    
    # Get the form first
    form = get_form(db, form_uuid)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    # Validate password
    if form.password:
        if not password:
            raise HTTPException(
                status_code=422, 
                detail="Password is required to view responses"
            )
        if password != form.password:
            raise HTTPException(
                status_code=401, 
                detail="Invalid password"
            )
    
    # Get responses
    responses = db.query(models.Response).filter(
        models.Response.form_uuid == form_uuid
    ).all()
    
    # Convert UUIDs to strings
    for response in responses:
        response.id = str(response.id)
        response.form_uuid = str(response.form_uuid)
    
    # Process fields to include sub-questions
    processed_fields = {}
    for field_name, field_config in form.fields.items():
        if isinstance(field_config, dict):
            processed_fields[field_name] = {
                'type': field_config.get('type', 'text'),
                'options': field_config.get('options', []),
                'required': field_config.get('required', False),
                'subQuestions': field_config.get('subQuestions', {})
            }
        else:
            processed_fields[field_name] = {
                'type': 'text',
                'required': False
            }

    # Process responses
    processed_responses = []
    for response in responses:
        processed_response = {}
        for field_name, response_data in response.response_data.items():
            if isinstance(response_data, dict):
                processed_response[field_name] = {
                    'value': response_data.get('value', ''),
                    'subResponses': response_data.get('subResponses', {})
                }
            else:
                processed_response[field_name] = {
                    'value': response_data,
                    'subResponses': {}
                }
        processed_responses.append(processed_response)
    
    return {
        "title": form.title,
        "fields": processed_fields,
        "responses": processed_responses
    } 