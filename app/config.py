import os
from dotenv import load_dotenv

# Load environment variables
# load_dotenv()

# Get Database URL directly from environment variable
DATABASE_URL = "postgresql://postgres.syuyrduryrlvlkrnmyzp:112233445566778899qwe@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

# Additional database configuration
CONNECT_ARGS = {} 