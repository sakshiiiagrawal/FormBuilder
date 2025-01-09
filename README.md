# Form Builder Service

A web application that allows users to create forms similar to Google Forms, with support for CSV uploads and password-protected responses.

## Features

- Create forms manually with different field types
- Upload CSV files to generate forms
- Set form expiry dates
- Password-protect form responses
- View form responses after expiry with password authentication

## Tech Stack

- Backend: FastAPI (Python)
- Frontend: React with Material-UI
- Database: PostgreSQL (via Supabase)
- Container: Docker

## Getting Started

1. Clone the repository
2. Make sure you have Docker and Docker Compose installed
3. Run the application:

```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Project Structure

- `/app`: Backend FastAPI application
- `/frontend`: React frontend application
- `docker-compose.yml`: Docker composition file
- `Dockerfile.backend`: Backend Docker configuration
- `Dockerfile.frontend`: Frontend Docker configuration

## API Endpoints

- `POST /create-form`: Create a new form
- `POST /upload-form`: Create a form from CSV
- `GET /form/{uuid}`: Get form details
- `POST /submit-form/{uuid}`: Submit form response
- `GET /view-responses/{uuid}`: View form responses (password protected)

## Development

To run the application in development mode:

1. Start the containers:
```bash
docker-compose up
```

2. The frontend and backend have hot-reload enabled, so any changes will be reflected immediately.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 