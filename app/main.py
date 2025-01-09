from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import get_db
from sqlalchemy.orm import Session
import crud, models, schemas
from typing import List
import uuid

app = FastAPI(title="Form Builder API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Form Builder API"}

@app.post("/create-form", response_model=schemas.FormResponse)
def create_form(form: schemas.FormCreate, db: Session = Depends(get_db)):
    return crud.create_form(db=db, form=form)

@app.post("/upload-form", response_model=schemas.FormResponse)
async def upload_form(file: bytes, db: Session = Depends(get_db)):
    return crud.create_form_from_csv(db=db, csv_content=file)

@app.get("/form/{uuid}", response_model=schemas.Form)
def get_form(uuid: uuid.UUID, db: Session = Depends(get_db)):
    form = crud.get_form(db=db, form_uuid=uuid)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form

@app.post("/submit-form/{uuid}")
def submit_form(uuid: uuid.UUID, response: schemas.ResponseCreate, db: Session = Depends(get_db)):
    return crud.create_response(db=db, form_uuid=uuid, response=response)

@app.get("/view-responses/{uuid}", response_model=List[schemas.Response])
def view_responses(uuid: uuid.UUID, password: str, db: Session = Depends(get_db)):
    return crud.get_responses(db=db, form_uuid=uuid, password=password) 