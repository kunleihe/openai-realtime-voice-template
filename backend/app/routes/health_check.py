from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.config import CORS_ORIGINS, ENVIRONMENT

health_check_router = APIRouter()


@health_check_router.get("/")
async def health_check():
    return {
        "status": "healthy",
        "message": "Convo Book API is running",
        "environment": ENVIRONMENT,
        "cors_origins": CORS_ORIGINS
    }
