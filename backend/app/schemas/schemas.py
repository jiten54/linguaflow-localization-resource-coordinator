from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str
    role: str
    title: str
    department: str
    phone: Optional[str] = None
    status: str = "ACTIVE"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ClientBase(BaseModel):
    name: str
    industry: str
    tier: str = "ENTERPRISE"
    primary_contact: str
    email: str
    sla_hours: int = 48

class ClientResponse(ClientBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    name: str
    client_id: str
    client_name: str
    coordinator_id: str
    coordinator_name: str
    description: Optional[str] = ""
    source_language: str = "EN-US"
    target_languages: List[str] = ["DE-DE"]
    domain: str = "GENERAL"
    word_count: int = 1000
    file_count: int = 1
    priority: str = "MEDIUM"
    requested_start_date: Optional[datetime] = None
    delivery_deadline: datetime
    tm_requirement: Optional[str] = ""
    glossary_requirement: Optional[str] = ""
    customer_instructions: Optional[str] = ""
    internal_notes: Optional[str] = ""

class ProjectResponse(ProjectCreate):
    id: str
    reference: str
    status: str
    risk_status: str
    risk_reason: Optional[str] = None
    assigned_translator_id: Optional[str] = None
    assigned_translator_name: Optional[str] = None
    assigned_reviewer_id: Optional[str] = None
    assigned_reviewer_name: Optional[str] = None
    estimated_effort_hours: float
    progress_percent: int
    delivery_checklist: Dict[str, Any]
    activity_history: List[Dict[str, Any]]
    created_at: datetime
    actual_delivered_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AssignmentCreate(BaseModel):
    project_id: str
    resource_id: str
    role: str = "TRANSLATOR"
    notes: Optional[str] = None
    override_reason: Optional[str] = None

class AssignmentResponse(BaseModel):
    id: str
    reference: str
    project_id: str
    project_reference: str
    project_name: str
    resource_id: str
    resource_name: str
    role: str
    language_pair: str
    assigned_word_count: int
    estimated_effort_hours: float
    assigned_date: datetime
    expected_start_date: datetime
    expected_completion_date: datetime
    status: str
    progress_percent: int
    deadline_risk: str
    conflict_warning: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class QualityIssueCreate(BaseModel):
    project_id: str
    project_reference: str
    project_name: str
    category: str = "TERMINOLOGY"
    severity: str = "MAJOR"
    description: str
    source_segment: Optional[str] = None
    target_segment: Optional[str] = None
    suggested_correction: Optional[str] = None
    reporter_id: str
    reporter_name: str
    assigned_owner_id: str
    assigned_owner_name: str

class QualityIssueResponse(QualityIssueCreate):
    id: str
    reference: str
    status: str
    corrective_action: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FileAnalysisRequest(BaseModel):
    project_id: str
    file_name: str
    file_content: str

class FileReportResponse(BaseModel):
    id: str
    project_id: str
    file_name: str
    file_size_formatted: str
    format: str
    uploaded_at: datetime
    word_count: int
    character_count: int
    character_count_no_spaces: int
    line_count: int
    encoding: str
    is_utf8_valid: bool
    is_empty: bool
    duplicate_segments_found: int
    readiness_status: str
    sample_preview: str
    checklist: Dict[str, bool]

    class Config:
        from_attributes = True
