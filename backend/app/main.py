from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.routes.health_check import health_check_router
from app.routes.realtime import realtime_router
from app.config import CORS_ORIGINS

app = FastAPI(title="Convo Book API", description="Real-time communication hub")

# Add CORS middleware - dynamically configured based on environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(health_check_router, prefix="/health")
app.include_router(realtime_router)

# Root API endpoint
@app.get("/")
async def root():
    return {"message": "Convo Book API", "status": "running", "docs": "/docs"}

# Mount React app (when built for production)
import os
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
frontend_build_path = os.path.join(project_root, "frontend", "build")

# Only mount static files if build directory exists (production mode)
if os.path.exists(frontend_build_path):
    app.mount("/app", StaticFiles(directory=frontend_build_path, html=True), name="react-app")
