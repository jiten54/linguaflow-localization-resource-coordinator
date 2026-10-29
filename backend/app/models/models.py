import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum,
    JSON,
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    RESOURCE_COORDINATOR = "RESOURCE_COORDINATOR"
    PROJECT_MANAGER = "PROJECT_MANAGER"
    LINGUISTIC_RESOURCE = "LINGUISTIC_RESOURCE"

class ProjectStatus(str, enum.Enum):
    REQUEST_RECEIVED = "REQUEST_RECEIVED"
    FILE_PREPARATION = "FILE_PREPARATION"
    RESOURCE_ASSIGNMENT = "RESOURCE_ASSIGNMENT"
    TRANSLATION = "TRANSLATION"
    LINGUISTIC_REVIEW = "LINGUISTIC_REVIEW"
    QUALITY_ASSURANCE = "QUALITY_ASSURANCE"
    DELIVERY = "DELIVERY"
    COMPLETED = "COMPLETED"
    ON_HOLD = "ON_HOLD"

class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class RiskLevel(str, enum.Enum):
    ON_TRACK = "ON_TRACK"
    LOW_RISK = "LOW_RISK"
    AT_RISK = "AT_RISK"
    CRITICAL_OVERDUE = "CRITICAL_OVERDUE"
    HOLD = "HOLD"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

class Client(Base):
    __tablename__ = "clients"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    industry = Column(String, nullable=False)
    tier = Column(String, default="ENTERPRISE")
    primary_contact = Column(String, nullable=False)
    email = Column(String, nullable=False)
    sla_hours = Column(Integer, default=48)
    created_at = Column(DateTime, default=datetime.utcnow)

class LinguisticResource(Base):
    __tablename__ = "linguistic_resources"

    id = Column(String, primary_key=True, index=True)
    display_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    resource_type = Column(String, default="TRANSLATOR")
    native_languages = Column(JSON, default=list) # e.g. ["DE"]
    language_pairs = Column(JSON, default=list) # e.g. [{"source": "EN", "target": "DE"}]
    proficiencies = Column(JSON, default=dict)
    specialties = Column(JSON, default=list) # e.g. ["MEDICAL", "LEGAL"]
    qualification_status = Column(String, default="VERIFIED") # VERIFIED, PENDING, EXPIRED
    availability_status = Column(String, default="AVAILABLE") # AVAILABLE, BUSY, UNAVAILABLE
    working_hours = Column(String, default="09:00 - 18:00 CET")
    time_zone = Column(String, default="UTC+1")
    daily_capacity_words = Column(Integer, default=2500)
    current_workload_words = Column(Integer, default=0)
    quality_score = Column(Float, default=95.0)
    on_time_delivery_rate = Column(Float, default=98.0)
    completed_projects_count = Column(Integer, default=0)
    hourly_rate_eur = Column(Float, default=45.0)
    words_per_hour_avg = Column(Integer, default=320)
    contact_phone = Column(String, nullable=True)
    internal_notes = Column(Text, nullable=True)
    location = Column(String, default="Europe")

class TranslationProject(Base):
    __tablename__ = "translation_projects"

    id = Column(String, primary_key=True, index=True)
    reference = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    client_id = Column(String, ForeignKey("clients.id"))
    client_name = Column(String, nullable=False)
    coordinator_id = Column(String, ForeignKey("users.id"))
    coordinator_name = Column(String, nullable=False)
    description = Column(Text, default="")
    source_language = Column(String, default="EN-US")
    target_languages = Column(JSON, default=list) # ["DE-DE"]
    domain = Column(String, default="GENERAL")
    word_count = Column(Integer, default=1000)
    file_count = Column(Integer, default=1)
    priority = Column(Enum(Priority), default=Priority.MEDIUM)
    created_at = Column(DateTime, default=datetime.utcnow)
    requested_start_date = Column(DateTime, default=datetime.utcnow)
    delivery_deadline = Column(DateTime, nullable=False)
    assigned_translator_id = Column(String, nullable=True)
    assigned_translator_name = Column(String, nullable=True)
    assigned_reviewer_id = Column(String, nullable=True)
    assigned_reviewer_name = Column(String, nullable=True)
    tm_requirement = Column(Text, default="")
    glossary_requirement = Column(Text, default="")
    customer_instructions = Column(Text, default="")
    status = Column(Enum(ProjectStatus), default=ProjectStatus.REQUEST_RECEIVED)
    previous_status_before_hold = Column(String, nullable=True)
    hold_reason = Column(Text, nullable=True)
    risk_status = Column(Enum(RiskLevel), default=RiskLevel.ON_TRACK)
    risk_reason = Column(Text, nullable=True)
    estimated_effort_hours = Column(Float, default=8.0)
    internal_notes = Column(Text, default="")
    progress_percent = Column(Integer, default=0)
    delivery_checklist = Column(JSON, default=dict)
    activity_history = Column(JSON, default=list)
    actual_delivered_at = Column(DateTime, nullable=True)

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String, primary_key=True, index=True)
    reference = Column(String, unique=True, index=True, nullable=False)
    project_id = Column(String, ForeignKey("translation_projects.id"))
    project_reference = Column(String, nullable=False)
    project_name = Column(String, nullable=False)
    resource_id = Column(String, ForeignKey("linguistic_resources.id"))
    resource_name = Column(String, nullable=False)
    role = Column(String, default="TRANSLATOR")
    language_pair = Column(String, nullable=False)
    assigned_word_count = Column(Integer, default=1000)
    estimated_effort_hours = Column(Float, default=3.5)
    assigned_date = Column(DateTime, default=datetime.utcnow)
    expected_start_date = Column(DateTime, default=datetime.utcnow)
    expected_completion_date = Column(DateTime, nullable=False)
    status = Column(String, default="IN_PROGRESS")
    progress_percent = Column(Integer, default=0)
    deadline_risk = Column(String, default="LOW")
    conflict_warning = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

class QualityIssue(Base):
    __tablename__ = "quality_issues"

    id = Column(String, primary_key=True, index=True)
    reference = Column(String, unique=True, index=True, nullable=False)
    project_id = Column(String, ForeignKey("translation_projects.id"))
    project_reference = Column(String, nullable=False)
    project_name = Column(String, nullable=False)
    category = Column(String, default="TERMINOLOGY")
    severity = Column(String, default="MAJOR") # CRITICAL, MAJOR, MINOR
    description = Column(Text, nullable=False)
    source_segment = Column(Text, nullable=True)
    target_segment = Column(Text, nullable=True)
    suggested_correction = Column(Text, nullable=True)
    reporter_id = Column(String, nullable=False)
    reporter_name = Column(String, nullable=False)
    assigned_owner_id = Column(String, nullable=False)
    assigned_owner_name = Column(String, nullable=False)
    status = Column(String, default="OPEN") # OPEN, IN_PROGRESS, RESOLVED, ACCEPTED_WITH_JUSTIFICATION
    corrective_action = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class FileReport(Base):
    __tablename__ = "file_reports"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("translation_projects.id"))
    file_name = Column(String, nullable=False)
    file_size_formatted = Column(String, default="0 KB")
    format = Column(String, default="TXT")
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    word_count = Column(Integer, default=0)
    character_count = Column(Integer, default=0)
    character_count_no_spaces = Column(Integer, default=0)
    line_count = Column(Integer, default=0)
    encoding = Column(String, default="UTF-8")
    is_utf8_valid = Column(Boolean, default=True)
    is_empty = Column(Boolean, default=False)
    duplicate_segments_found = Column(Integer, default=0)
    readiness_status = Column(String, default="PENDING_REVIEW")
    sample_preview = Column(Text, default="")
    checklist = Column(JSON, default=dict)
