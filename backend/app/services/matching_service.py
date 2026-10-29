from typing import List, Dict, Any

def score_candidate(resource: Dict[str, Any], project: Dict[str, Any], weights: Dict[str, int]) -> Dict[str, Any]:
    disqualification_reasons = []
    explanations = []

    project_source = project.get("source_language", "EN").split("-")[0].upper()
    project_targets = [t.split("-")[0].upper() for t in project.get("target_languages", ["DE"])]

    # Hard eligibility check 1: Language Pairs
    pairs = resource.get("language_pairs", [])
    has_match = any(
        p.get("source", "").split("-")[0].upper() == project_source and
        p.get("target", "").split("-")[0].upper() in project_targets
        for p in pairs
    )
    if not has_match:
        disqualification_reasons.append(f"Does not support {project_source} -> {', '.join(project_targets)}")

    # Hard eligibility check 2: Qualification
    if resource.get("qualification_status") != "VERIFIED":
        disqualification_reasons.append(f"Qualification status is {resource.get('qualification_status')}")

    # Hard eligibility check 3: Availability
    if resource.get("availability_status") == "UNAVAILABLE":
        disqualification_reasons.append("Resource is marked unavailable")

    is_eligible = len(disqualification_reasons) == 0

    # 4-Pillar Scoring
    lang_weight = weights.get("language_pair", 25)
    spec_weight = weights.get("specialty", 25)
    cap_weight = weights.get("capacity", 25)
    qual_weight = weights.get("quality", 25)

    # 1. Native / Target Proficiency
    natives = [n.upper() for n in resource.get("native_languages", [])]
    is_native = any(t in natives for t in project_targets)
    if is_native:
        lang_score = lang_weight
        explanations.append(f"Native speaker in target language: {lang_score} pts")
    else:
        lang_score = int(lang_weight * 0.8)
        explanations.append(f"C2/C1 target proficiency: {lang_score} pts")

    # 2. Domain Specialty
    specialties = resource.get("specialties", [])
    proj_domain = project.get("domain", "GENERAL")
    if proj_domain in specialties:
        domain_score = spec_weight
        explanations.append(f"Direct SME domain match in {proj_domain}: {domain_score} pts")
    else:
        domain_score = int(spec_weight * 0.4)
        explanations.append(f"Secondary domain experience: {domain_score} pts")

    # 3. Capacity
    daily_cap = resource.get("daily_capacity_words", 2500)
    current_load = resource.get("current_workload_words", 0)
    remaining = max(0, daily_cap - current_load)
    needed = int(project.get("word_count", 1000) / 3)
    if remaining >= needed * 1.5:
        cap_score = cap_weight
        explanations.append(f"Ample daily headroom ({remaining} words free): {cap_score} pts")
    elif remaining >= needed:
        cap_score = int(cap_weight * 0.7)
        explanations.append(f"Adequate daily capacity ({remaining} words free): {cap_score} pts")
    else:
        cap_score = int(cap_weight * 0.3)
        explanations.append(f"Tight capacity buffer ({remaining} words free): {cap_score} pts")

    # 4. Quality & On-Time Performance
    q_score = resource.get("quality_score", 95.0)
    ontime = resource.get("on_time_delivery_rate", 98.0)
    norm = (q_score / 100.0) * 0.6 + (ontime / 100.0) * 0.4
    qual_score = int(norm * qual_weight)
    explanations.append(f"Historical QA rating {q_score}% & {ontime}% SLA: {qual_score} pts")

    total_score = min(100, lang_score + domain_score + cap_score + qual_score) if is_eligible else 0

    return {
        "resource": resource,
        "is_eligible": is_eligible,
        "disqualification_reasons": disqualification_reasons,
        "total_score": total_score,
        "breakdown": {
            "language_pair_score": lang_score,
            "domain_expertise_score": domain_score,
            "capacity_score": cap_score,
            "quality_metric_score": qual_score,
        },
        "explanations": explanations,
    }
