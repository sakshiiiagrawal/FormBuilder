import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Database URL directly from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

# Additional database configuration
CONNECT_ARGS = {} 