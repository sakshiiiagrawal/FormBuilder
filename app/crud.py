from sqlalchemy.orm import Session
import models, schemas
import uuid
import pandas as pd
from fastapi import HTTPException
from datetime import datetime
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_form(db: Session, form: schemas.FormCreate):
    db_form = models.Form(
        uuid=uuid.uuid4(),
        title=form.title,
        fields=form.fields,
        password=pwd_context.hash(form.password) if form.password else None,
        expiry=form.expiry
    )
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    return schemas.FormResponse(uuid=db_form.uuid)

def create_form_from_csv(db: Session, csv_content: bytes):
    try:
        df = pd.read_csv(csv_content)
        fields = {col: df[col].dropna().tolist() for col in df.columns}
        form = schemas.FormCreate(
            title="Form from CSV",
            fields=fields
        )
        return create_form(db, form)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")

def get_form(db: Session, form_uuid: uuid.UUID):
    return db.query(models.Form).filter(models.Form.uuid == form_uuid).first()

def create_response(db: Session, form_uuid: uuid.UUID, response: schemas.ResponseCreate):
    form = get_form(db, form_uuid)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    if form.expiry and datetime.utcnow() > form.expiry:
        raise HTTPException(status_code=400, detail="Form has expired")

    db_response = models.Response(
        form_uuid=form_uuid,
        response_data=response.response_data
    )
    db.add(db_response)
    db.commit()
    db.refresh(db_response)
    return db_response

def get_responses(db: Session, form_uuid: uuid.UUID, password: str):
    form = get_form(db, form_uuid)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    if form.password:
        if not password or not pwd_context.verify(password, form.password):
            raise HTTPException(status_code=401, detail="Invalid password")

    return db.query(models.Response).filter(models.Response.form_uuid == form_uuid).all() 