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

# CORS Configuration - Environment Aware
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

def get_cors_origins():
    """Get CORS allowed origins based on environment"""
    if ENVIRONMENT == "production":
        # Production origins - replace with your actual domain
        return [
            "https://yourdomain.com",
            "https://www.yourdomain.com",
        ]
    elif ENVIRONMENT == "staging":
        # Staging origins
        return [
            "https://staging.yourdomain.com",
            "http://localhost:5173",  # For local testing against staging
        ]
    else:
        # Development origins (default)
        return [
            "http://localhost:5173",
            "http://localhost:8000",
        ]

CORS_ORIGINS = get_cors_origins()
