"""Vercel Serverless Function entrypoint for KeyMuse FastAPI backend."""
import sys
import os

# Set VERCEL environment variable and writable directories
os.environ["VERCEL"] = "1"
os.environ["KEYMUSE_OUTPUT_DIR"] = "/tmp/keymuse_output"
os.environ["AUTOPILOT_OUTPUT_DIR"] = "/tmp/keymuse_output/web_projects"
os.environ["DATABASE_URL"] = "sqlite:////tmp/keymuse.db"

# Ensure repository root and backend directory are on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from backend.app.main import app
