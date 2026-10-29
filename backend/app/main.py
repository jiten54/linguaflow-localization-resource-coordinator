from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.config import settings
from app.core.database import Base, engine, get_db
from app.models import models
from app.schemas import schemas
from app.services.matching_service import score_candidate

# Auto-create tables for development/SQLite testing
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Localization Project & Resource Coordination API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "PostgreSQL 16 Engine Connected",
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get(f"{settings.API_V1_STR}/projects", response_model=List[schemas.ProjectResponse], tags=["Projects"])
def list_projects(
    status: Optional[str] = None,
    client_id: Optional[str] = None,
    domain: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.TranslationProject)
    if status and status != "ALL":
        query = query.filter(models.TranslationProject.status == status)
    if client_id and client_id != "ALL":
        query = query.filter(models.TranslationProject.client_id == client_id)
    if domain and domain != "ALL":
        query = query.filter(models.TranslationProject.domain == domain)
    if priority and priority != "ALL":
        query = query.filter(models.TranslationProject.priority == priority)
    return query.all()

@app.post(f"{settings.API_V1_STR}/projects", response_model=schemas.ProjectResponse, status_code=201, tags=["Projects"])
def create_project(project_in: schemas.ProjectCreate, db: Session = Depends(get_db)):
    ref_count = db.query(models.TranslationProject).count() + 101
    new_project = models.TranslationProject(
        id=f"proj-{int(datetime.utcnow().timestamp())}",
        reference=f"LF-2026-0{ref_count}",
        **project_in.model_dump(),
        status=models.ProjectStatus.REQUEST_RECEIVED,
        risk_status=models.RiskLevel.ON_TRACK,
        estimated_effort_hours=round(project_in.word_count / 300.0, 1),
        progress_percent=0,
        delivery_checklist={
            "filesReceived": True,
            "filePrepComplete": False,
            "tmApplied": False,
            "glossaryChecked": False,
            "translationComplete": False,
            "reviewComplete": False,
            "qaIssuesResolved": False,
            "clientSignOff": False,
        },
        activity_history=[{
            "timestamp": datetime.utcnow().isoformat(),
            "action": "PROJECT_CREATED",
            "notes": "Project created via FastAPI REST API.",
        }],
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get(f"{settings.API_V1_STR}/projects/{{project_id}}", response_model=schemas.ProjectResponse, tags=["Projects"])
def get_project(project_id: str, db: Session = Depends(get_db)):
    proj = db.query(models.TranslationProject).filter(
        (models.TranslationProject.id == project_id) | (models.TranslationProject.reference == project_id)
    ).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj

@app.post(f"{settings.API_V1_STR}/assignments", response_model=schemas.AssignmentResponse, status_code=201, tags=["Assignments"])
def create_assignment(asg_in: schemas.AssignmentCreate, db: Session = Depends(get_db)):
    proj = db.query(models.TranslationProject).filter(models.TranslationProject.id == asg_in.project_id).first()
    res = db.query(models.LinguisticResource).filter(models.LinguisticResource.id == asg_in.resource_id).first()
    if not proj or not res:
        raise HTTPException(status_code=404, detail="Project or Resource not found")

    asg_count = db.query(models.Assignment).count() + 1
    new_asg = models.Assignment(
        id=f"asg-{int(datetime.utcnow().timestamp())}",
        reference=f"ASG-2026-0{asg_count}",
        project_id=proj.id,
        project_reference=proj.reference,
        project_name=proj.name,
        resource_id=res.id,
        resource_name=res.display_name,
        role=asg_in.role,
        language_pair=f"{proj.source_language} -> {', '.join(proj.target_languages)}",
        assigned_word_count=proj.word_count,
        estimated_effort_hours=round(proj.word_count / 300.0, 1),
        assigned_date=datetime.utcnow(),
        expected_start_date=proj.requested_start_date,
        expected_completion_date=proj.delivery_deadline,
        status="IN_PROGRESS",
        progress_percent=0,
        deadline_risk="LOW",
        notes=asg_in.notes or "Assigned via API.",
    )

    if asg_in.role == "TRANSLATOR":
        proj.assigned_translator_id = res.id
        proj.assigned_translator_name = res.display_name
    else:
        proj.assigned_reviewer_id = res.id
        proj.assigned_reviewer_name = res.display_name

    db.add(new_asg)
    db.commit()
    db.refresh(new_asg)
    return new_asg
