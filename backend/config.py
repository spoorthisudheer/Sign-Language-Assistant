"""
SignConnect AI - Backend Configuration
Handles environment-based application settings.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base Directory of backend
BASE_DIR = Path(__file__).resolve().parent

# Load .env if present
load_dotenv(BASE_DIR / '.env')


class Config:
    """Base application configuration."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'signconnect_ai_super_secret_jwt_key_2026_secure')
    
    # MySQL Database Settings
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'signconnect_ai')
    
    # JWT Settings
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 72))
    
    # Server Settings
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')
    
    # CORS Settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')
    
    # Models directory
    MODELS_DIR = BASE_DIR / 'models'
