from fastapi import APIRouter
from fastapi.responses import JSONResponse

health_check_router = APIRouter()


@health_check_router.get("/")
async def health_check():
    return JSONResponse(content={"status": "I am Alive!"}, status_code=200)
