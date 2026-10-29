from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# SQLite fallback for seamless standalone local testing or PostgreSQL in production
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://") or db_url.startswith("postgres://"):
    engine = create_engine(db_url, pool_pre_ping=True)
else:
    engine = create_engine("sqlite:///./linguaflow.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
