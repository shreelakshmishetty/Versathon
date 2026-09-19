import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_HOST = os.getenv('DATABASE_HOST', 'localhost')
DATABASE_PORT = os.getenv('DATABASE_PORT', '3306')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'h2_medical_reports')
DATABASE_USER = os.getenv('DATABASE_USER', 'root')
DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD', '')

AI_API_KEY = os.getenv('AI_API_KEY', '')
AI_MODEL = os.getenv('AI_MODEL', 'gpt-4o-mini')
AI_BASE_URL = os.getenv('AI_BASE_URL', 'https://api.openai.com/v1')
SECRET_KEY = os.getenv('SECRET_KEY', 'change_me')
UPLOAD_DIRECTORY = os.getenv('UPLOAD_DIRECTORY', '../uploads')
GENERATED_REPORTS_DIRECTORY = os.getenv('GENERATED_REPORTS_DIRECTORY', '../generated_reports')
MAX_FILE_SIZE_MB = int(os.getenv('MAX_FILE_SIZE_MB', '10'))
ALLOWED_EXTENSIONS = {ext.strip().lower() for ext in os.getenv('ALLOWED_EXTENSIONS', '.pdf,.png,.jpg,.jpeg').split(',') if ext.strip()}
