from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.routes.health_check import health_check_router
from app.routes.realtime import realtime_router

app = FastAPI()

# Add CORS middleware for React development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registering routers first (before static files)
app.include_router(health_check_router, prefix="/health")
app.include_router(realtime_router)

# Mount React app (when built)
import os
# Get the project root directory (two levels up from backend/app/)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
frontend_build_path = os.path.join(project_root, "frontend", "build")
app.mount("/app", StaticFiles(directory=frontend_build_path, html=True), name="react-app")

# Mount original client files (keeps existing functionality)
client_path = os.path.join(project_root, "client")
app.mount("/", StaticFiles(directory=client_path, html=True), name="static")
