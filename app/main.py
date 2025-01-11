from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import uuid
from datetime import datetime
from typing import Dict, Optional, List
from sqlalchemy.orm import Session
import models, database, schemas, crud
import json
import io

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def read_spreadsheet(file: UploadFile) -> pd.DataFrame:
    """Read various spreadsheet formats into a pandas DataFrame."""
    file_extension = file.filename.split('.')[-1].lower()
    content = file.file.read()
    
    try:
        if file_extension == 'csv':
            # Try different encodings
            encodings = ['utf-8', 'latin1', 'iso-8859-1']
            for encoding in encodings:
                try:
                    return pd.read_csv(io.BytesIO(content), encoding=encoding)
                except UnicodeDecodeError:
                    continue
            raise HTTPException(status_code=400, detail="Could not decode CSV file")
            
        elif file_extension in ['xlsx', 'xls']:
            return pd.read_excel(io.BytesIO(content))
            
        elif file_extension == 'ods':
            return pd.read_excel(io.BytesIO(content), engine='odf')
            
        elif file_extension == 'numbers':
            raise HTTPException(
                status_code=400, 
                detail="Apple Numbers files are not directly supported. Please export your file as Excel (.xlsx) or CSV format first."
            )
            
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format: {file_extension}. Supported formats are: CSV, Excel (.xlsx, .xls), and OpenDocument Spreadsheet (.ods)"
            )
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

@app.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Validate file
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        # Read file content
        try:
            content = await file.read()
            if len(content) == 0:
                raise HTTPException(status_code=400, detail="Empty file provided")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

        # Create a new SpooledTemporaryFile with the content
        file.file = io.BytesIO(content)
        
        try:
            # Read the spreadsheet
            df = read_spreadsheet(file)
            
            # Print DataFrame info for debugging
            print(f"DataFrame columns: {df.columns.tolist()}")
            print(f"DataFrame shape: {df.shape}")
            
            # Validate required columns
            required_columns = ['Field Name', 'Field Type', 'Options']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Missing required columns: {', '.join(missing_columns)}. Required columns are: {', '.join(required_columns)}"
                )
            
            # Process the data
            fields = {}
            for index, row in df.iterrows():
                try:
                    field_name = str(row['Field Name']).strip()
                    if pd.isna(field_name) or not field_name:
                        continue  # Skip empty rows
                        
                    field_type = str(row['Field Type']).strip().lower()
                    
                    if field_type not in ['text', 'dropdown', 'multiselect', 'image']:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Invalid field type: '{field_type}' in row {index + 2}. Allowed types are: text, dropdown, multiselect, image"
                        )
                    
                    if field_type in ['dropdown', 'multiselect']:
                        if pd.isna(row['Options']):
                            raise HTTPException(
                                status_code=400, 
                                detail=f"Options required for {field_type} field '{field_name}' in row {index + 2}"
                            )
                        options = [opt.strip() for opt in str(row['Options']).split(',') if opt.strip()]
                        if not options:
                            raise HTTPException(
                                status_code=400, 
                                detail=f"No valid options provided for {field_type} field '{field_name}' in row {index + 2}"
                            )
                        fields[field_name] = {
                            'type': field_type,
                            'options': options,
                            'required': False
                        }
                    elif field_type == 'image':
                        fields[field_name] = {
                            'type': 'image',
                            'required': False
                        }
                    else:  # text field
                        fields[field_name] = {
                            'type': 'text',
                            'required': False
                        }
                        
                except Exception as e:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Error processing row {index + 2}: {str(e)}"
                    )
            
            if not fields:
                raise HTTPException(status_code=400, detail="No valid fields found in the file")
            
            # Create form in database
            form_uuid = str(uuid.uuid4())
            new_form = models.Form(
                uuid=form_uuid,
                title=f"Form from {file.filename}",
                fields=fields,
                created_at=datetime.utcnow()
            )
            
            db.add(new_form)
            db.commit()
            
            return {"uuid": form_uuid, "fields": fields}
            
        except pd.errors.EmptyDataError:
            raise HTTPException(status_code=400, detail="The file is empty or has no valid data")
        except Exception as e:
            print(f"Error processing file: {str(e)}")  # For server-side debugging
            raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@app.get("/")
def read_root():
    return {"message": "Form Builder API"}

@app.post("/create-form", response_model=schemas.FormResponse)
def create_form(form: schemas.FormCreate, db: Session = Depends(get_db)):
    return crud.create_form(db=db, form=form)

@app.get("/form/{uuid}", response_model=schemas.Form)
def get_form(uuid: uuid.UUID, db: Session = Depends(get_db)):
    form = crud.get_form(db=db, form_uuid=uuid)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form

@app.post("/submit-form/{uuid}")
def submit_form(uuid: uuid.UUID, response: schemas.ResponseCreate, db: Session = Depends(get_db)):
    return crud.create_response(db=db, form_uuid=uuid, response=response)

@app.get("/view-responses/{uuid}", response_model=schemas.ViewResponsesResponse)
def view_responses(uuid: uuid.UUID, password: str, db: Session = Depends(get_db)):
    return crud.get_responses(db=db, form_uuid=uuid, password=password) 