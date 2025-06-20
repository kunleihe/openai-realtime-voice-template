import os
from dotenv import load_dotenv

# Load environment variables from .env file
# Look for .env file in the same directory as config.py
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

# Configuration variables
VENDOR_WS_URL = os.getenv("OPENAI_REALTIME_URL")
API_KEY = os.getenv("OPENAI_API_KEY")
USE_AZURE_OPENAI = bool(os.getenv("USE_AZURE_OPENAI"))
