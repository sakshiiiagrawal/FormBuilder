from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import Union
import models, schemas
from fastapi import HTTPException

def create_form(db: Session, form: schemas.FormCreate):
    db_form = models.Form(
        title=form.title,
        fields=form.fields,
        password=form.password
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

    db_response = models.Response(
        form_uuid=form_uuid,
        response_data=response.response_data
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
    
    form = get_form(db, form_uuid)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    # Check if form requires password
    if form.password:
        if not password:
            raise HTTPException(status_code=401, detail="Password required to view responses")
        if password != form.password:
            raise HTTPException(status_code=401, detail="Invalid password")
    
    responses = db.query(models.Response).filter(
        models.Response.form_uuid == form_uuid
    ).all()
    
    # Convert UUIDs to strings in responses
    for response in responses:
        response.id = str(response.id)
        response.form_uuid = str(response.form_uuid)
    
    return {
        "fields": list(form.fields.keys()),
        "responses": [response.response_data for response in responses]
    } 