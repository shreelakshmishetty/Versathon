import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_USER = os.getenv('DATABASE_USER', 'root')
DB_PASSWORD = os.getenv('DATABASE_PASSWORD', '')
DB_HOST = os.getenv('DATABASE_HOST', 'localhost')
DB_PORT = os.getenv('DATABASE_PORT', '3306')
DB_NAME = os.getenv('DATABASE_NAME', 'h2_medical_reports')
USE_SQLITE_FALLBACK = os.getenv('USE_SQLITE_FALLBACK', 'false').lower() == 'true'

if USE_SQLITE_FALLBACK and (not DB_HOST or DB_HOST.lower() == 'localhost'):
    DATABASE_URL = 'sqlite:///./h2_local.db'
else:
    if DB_PASSWORD:
        DATABASE_URL = f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    else:
        DATABASE_URL = f'mysql+pymysql://{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def test_db_connection():
    with engine.connect() as connection:
        result = connection.execute(text('SELECT 1'))
        return result.scalar_one() == 1
