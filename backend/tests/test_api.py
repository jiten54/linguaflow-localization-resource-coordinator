import pytest
from app.services.matching_service import score_candidate

def test_matching_engine_hard_eligibility():
    resource = {
        "id": "res-1",
        "display_name": "Dr. Sophie Lin",
        "native_languages": ["DE"],
        "language_pairs": [{"source": "EN", "target": "DE"}],
        "specialties": ["MEDICAL"],
        "qualification_status": "VERIFIED",
        "availability_status": "AVAILABLE",
        "daily_capacity_words": 2800,
        "current_workload_words": 500,
        "quality_score": 98.0,
        "on_time_delivery_rate": 99.0,
    }

    project = {
        "source_language": "EN-US",
        "target_languages": ["DE-DE"],
        "domain": "MEDICAL",
        "word_count": 5000,
    }

    weights = {"language_pair": 25, "specialty": 25, "capacity": 25, "quality": 25}

    result = score_candidate(resource, project, weights)
    assert result["is_eligible"] is True
    assert result["total_score"] > 85
    assert len(result["disqualification_reasons"]) == 0

def test_matching_engine_disqualification():
    unqualified_resource = {
        "id": "res-unverified",
        "display_name": "Test Candidate",
        "native_languages": ["DE"],
        "language_pairs": [{"source": "EN", "target": "DE"}],
        "specialties": ["MEDICAL"],
        "qualification_status": "EXPIRED",
        "availability_status": "AVAILABLE",
        "daily_capacity_words": 2500,
        "current_workload_words": 0,
        "quality_score": 80.0,
        "on_time_delivery_rate": 80.0,
    }

    project = {
        "source_language": "EN-US",
        "target_languages": ["DE-DE"],
        "domain": "MEDICAL",
        "word_count": 3000,
    }

    weights = {"language_pair": 25, "specialty": 25, "capacity": 25, "quality": 25}

    result = score_candidate(unqualified_resource, project, weights)
    assert result["is_eligible"] is False
    assert result["total_score"] == 0
    assert any("Qualification status is EXPIRED" in r for r in result["disqualification_reasons"])
