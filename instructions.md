# Form Builder Service

## Project Description

This service enables users to create forms similar to Google Forms. Users can either create forms manually or upload an Excel (CSV) file to generate the form. The backend is built using **FastAPI**, the frontend is built with **React**, and **Supabase** is used for database management.

The service allows users to:
- Create forms using a user-friendly interface or by uploading a CSV file.
- Set expiry dates for forms and password-protect form responses.
- Generate a unique URL for each form using a UUID.
- View form responses using a password after expiry.

## Features

- **Homepage**:
  - Create a new form.
  - Upload a CSV file to create a form.
  - View existing forms.

- **Form Creation**:
  - Option to manually enter form fields (e.g., text, dropdown, multiselect).
  - Option to upload a CSV file containing field names and values.
  - Ability to set an expiry date for the form.
  - Password protection for viewing form responses.

- **Form Management**:
  - Forms are available until their expiry date. After expiry, users can no longer submit responses, but they can view them using a password.
  - Generate a unique URL for each form using a UUID (e.g., `/form/{uuid}`).
  - Submit responses to forms and store them in the database.

- **View Responses**:
  - Use the form’s unique URL and password to view responses after the form has expired.

## File Structure

```
.
├── app/
│   ├── main.py                # FastAPI app initialization and routing
│   ├── models.py              # SQLAlchemy models for the database
│   ├── schemas.py             # Pydantic models for validation
│   ├── crud.py                # CRUD operations for handling database interactions
│   ├── form_utils.py          # Utility functions for form creation and expiry handling
│   ├── database.py            # Database connection setup
│   └── .env                   # Environment variables for DB credentials and secrets
├── alembic/                   # Database migrations (optional)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FormCreate.js  # Form creation page
│   │   │   ├── FormUpload.js  # CSV upload form page
│   │   │   ├── ViewResponses.js # View responses page
│   │   ├── App.js             # Main app component with routing
│   │   └── index.js           # Entry point for React app
│   ├── public/
│   │   └── index.html         # HTML template
│   └── package.json
├── requirements.txt           # Python dependencies for backend
└── README.md                  # Project documentation
```

## Rules

1. **Form Creation**:
   - Forms must be created either manually or by uploading a properly formatted CSV file.
   - CSV files must be validated for correct formatting before being processed.
   - Every form created must generate a **UUID** and store the form fields in the database.
   - A form can optionally have an **expiry date** and a **password** for viewing responses.
   
2. **Form Expiry**:
   - Forms will be available for submissions until the expiry date is reached.
   - Once expired, the form can no longer be submitted to but can still be accessed to view responses.
   - Expiry times are stored as timestamps in the database.
   
3. **Response Submission**:
   - Form responses must be submitted via POST requests and stored in the `responses` table in the database.
   - Responses must be associated with a form using the form's **UUID**.

4. **View Responses**:
   - Users can only view responses after the form has expired, using the **form UUID** and a **password**.
   - Accessing form responses without a valid password is prohibited.

5. **Database Management**:
   - **Supabase** will be used for database management. Forms and responses will be stored in relational tables.
   - Tables must be indexed on **UUID** for efficient querying.
   - A **password** field may optionally be set when creating a form. This password will be used to secure access to form responses after expiry.

6. **UUID and URL Structure**:
   - Every form must have a unique **UUID**.
   - Forms must be accessible via URLs formatted as `/form/{uuid}`.
   
7. **Security**:
   - Form responses must be secured by a **password** if requested during form creation.
   - Ensure that form submissions are validated and sanitized before saving to the database.
   - Ensure that passwords are stored securely (e.g., hashed) and never exposed in plain text.
   
8. **Frontend Behavior**:
   - Users must be able to view the form based on the **UUID** URL.
   - The form interface must adapt dynamically based on the form fields (e.g., dropdown, multiselect).
   - After expiry, forms should be inaccessible for submission but should still allow responses to be viewed using the password.
   
9. **Form Field Types**:
   - Forms should support multiple types of fields:
     - Text Input (Single Line)
     - Dropdown (Multiple choice)
     - Multiselect (Multiple choice with multiple selections allowed)
   
10. **API Endpoint Structure**:
    - **POST /create-form**:
      - Accepts form details (fields, expiry, password).
      - Returns the UUID of the created form.
    - **POST /upload-form**:
      - Accepts a CSV file to generate a new form.
      - Returns the UUID of the generated form.
    - **GET /form/{uuid}**:
      - Returns the form’s frontend, including its fields.
    - **POST /submit-form/{uuid}**:
      - Accepts responses for the form identified by the UUID.
    - **GET /view-responses/{uuid}**:
      - Accepts the form’s password and returns all responses for the given form.

---

## Database Schema

1. **Forms Table**:
   - Stores information about forms (UUID, fields, expiry, password).
   - `uuid` is the primary key.
   - Example schema:

   ```sql
   create table forms (
       uuid uuid primary key,
       title text not null,
       fields jsonb not null,
       password text,
       expiry timestamp,
       created_at timestamp default now(),
       updated_at timestamp default now()
   );
   ```

2. **Responses Table**:
   - Stores responses submitted to forms.
   - Each response is linked to a form using the **UUID**.
   - Example schema:

   ```sql
   create table responses (
       id serial primary key,
       form_uuid uuid references forms(uuid) on delete cascade,
       response_data jsonb,
       created_at timestamp default now()
   );
   ```

3. **Logs Table** (optional):
   - Tracks form-related actions such as submissions and view attempts.
   - Example schema:

   ```sql
   create table logs (
       id serial primary key,
       action text,
       user_id text,
       form_uuid uuid references forms(uuid),
       timestamp timestamp default now()
   );
   ```

---

## Conclusion

This service allows users to create forms, submit responses, and view responses with password protection after expiry. The backend is implemented with **FastAPI**, the frontend is built with **React**, and **Supabase** is used as the database provider. Ensure strict adherence to the rules for form creation, expiry, and response viewing to maintain system integrity.