from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routes.health_check import health_check_router
from app.routes.realtime import realtime_router

app = FastAPI()

# Registering routers first (before static files)
app.include_router(health_check_router)
app.include_router(realtime_router)

# Mount static files from client directory
app.mount("/", StaticFiles(directory="client", html=True), name="static")
