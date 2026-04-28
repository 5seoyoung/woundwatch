from sqlalchemy import create_engine, Column, String, Float, Boolean, Integer, DateTime
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from datetime import datetime, timezone
from app.core.config import settings

engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

class WoundRecord(Base):
    __tablename__ = "wound_records"

    id          = Column(Integer, primary_key=True, index=True)
    patient_id  = Column(String, index=True, nullable=False)
    image_path  = Column(String, nullable=False)
    date        = Column(String, nullable=False)
    infection   = Column(Boolean, default=False)
    ischemia    = Column(Boolean, default=False)
    severity    = Column(Float, default=0.0)
    area_cm2    = Column(Float, nullable=True)
    risk_level  = Column(String, default="LOW")
    description = Column(String, nullable=True)
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
