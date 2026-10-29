import {
  LinguisticResource,
  TranslationProject,
  CandidateMatchScore,
  OperationalSettings,
} from '../types';

export function calculateCandidateMatch(
  resource: LinguisticResource,
  project: TranslationProject,
  settings: OperationalSettings
): CandidateMatchScore {
  const disqualificationReasons: string[] = [];
  const explanations: string[] = [];

  // Normalize source and target codes (e.g. "EN-US" -> "EN", "DE-DE" -> "DE")
  const projectSource = project.sourceLanguage.split('-')[0].toUpperCase();
  const projectTargets = project.targetLanguages.map((t) => t.split('-')[0].toUpperCase());

  // Check 1: Mandatory Language Pair eligibility
  const hasMatchingPair = resource.languagePairs.some((pair) => {
    const pairSource = pair.source.split('-')[0].toUpperCase();
    const pairTarget = pair.target.split('-')[0].toUpperCase();
    return pairSource === projectSource && projectTargets.includes(pairTarget);
  });

  if (!hasMatchingPair) {
    disqualificationReasons.push(
      `Resource language pairs do not cover ${project.sourceLanguage} -> ${project.targetLanguages.join(', ')}.`
    );
  }

  // Check 2: Mandatory Qualification Status
  if (resource.qualificationStatus !== 'VERIFIED') {
    disqualificationReasons.push(
      `Qualification status is ${resource.qualificationStatus}. Only verified linguists may be assigned.`
    );
  }

  // Check 3: Mandatory Availability Status
  if (resource.availabilityStatus === 'UNAVAILABLE') {
    disqualificationReasons.push('Resource is currently marked unavailable (sabbatical, leave, or off-duty).');
  }

  const isEligible = disqualificationReasons.length === 0;

  // Weighted Scoring Model
  let languagePairScore = 0;
  let domainExpertiseScore = 0;
  let capacityScore = 0;
  let qualityMetricScore = 0;

  const weights = settings.weights;

  // 1. Language Pair & Native Mastery Scoring (Weight: settings.weights.languagePair)
  const isTargetNative = projectTargets.some((t) =>
    resource.nativeLanguages.some((native) => native.toUpperCase() === t)
  );
  const targetProficiency = projectTargets.map((t) => resource.proficiencies[t] || 'C1')[0];

  if (isTargetNative) {
    languagePairScore = weights.languagePair;
    explanations.push(`Native speaker in target language (${projectTargets.join(', ')}): Full ${weights.languagePair} pts.`);
  } else if (targetProficiency === 'C2') {
    languagePairScore = Math.round(weights.languagePair * 0.9);
    explanations.push(`C2 Master proficiency in target language: ${languagePairScore} pts.`);
  } else {
    languagePairScore = Math.round(weights.languagePair * 0.7);
    explanations.push(`C1 Advanced proficiency in target language: ${languagePairScore} pts.`);
  }

  // 2. Domain / Subject-Matter Expertise (Weight: settings.weights.specialty)
  if (resource.specialties.includes(project.domain)) {
    domainExpertiseScore = weights.specialty;
    explanations.push(`Direct subject-matter expertise in ${project.domain}: Full ${weights.specialty} pts.`);
  } else if (resource.specialties.includes('GENERAL')) {
    domainExpertiseScore = Math.round(weights.specialty * 0.5);
    explanations.push(`General linguistics expertise, secondary domain fit: ${domainExpertiseScore} pts.`);
  } else {
    domainExpertiseScore = Math.round(weights.specialty * 0.25);
    explanations.push(`Cross-domain linguist with adjacent technical background: ${domainExpertiseScore} pts.`);
  }

  // 3. Workload & Capacity Feasibility (Weight: settings.weights.capacity)
  const remainingDailyCapacity = Math.max(0, resource.dailyCapacityWords - resource.currentWorkloadWords);
  const wordsPerDayNeeded = Math.ceil(project.wordCount / 3); // rough 3-day baseline

  if (remainingDailyCapacity >= wordsPerDayNeeded * 1.5) {
    capacityScore = weights.capacity;
    explanations.push(
      `Excellent remaining capacity (${remainingDailyCapacity.toLocaleString()} words/day available vs ${wordsPerDayNeeded.toLocaleString()} needed): Full ${weights.capacity} pts.`
    );
  } else if (remainingDailyCapacity >= wordsPerDayNeeded) {
    capacityScore = Math.round(weights.capacity * 0.75);
    explanations.push(
      `Adequate capacity available (${remainingDailyCapacity.toLocaleString()} words/day): ${capacityScore} pts.`
    );
  } else {
    capacityScore = Math.round(weights.capacity * 0.3);
    explanations.push(
      `Near daily capacity ceiling (${remainingDailyCapacity.toLocaleString()} words/day remaining): ${capacityScore} pts.`
    );
  }

  // 4. Quality Metric & On-Time Performance (Weight: settings.weights.quality)
  const normalizedQuality = (resource.qualityScore / 100) * 0.6 + (resource.onTimeDeliveryRate / 100) * 0.4;
  qualityMetricScore = Math.round(normalizedQuality * weights.quality);
  explanations.push(
    `Historical QA rating ${resource.qualityScore}% & ${resource.onTimeDeliveryRate}% on-time rate (${resource.completedProjectsCount} projects): ${qualityMetricScore} pts.`
  );

  const totalScore = isEligible
    ? Math.min(100, Math.round(languagePairScore + domainExpertiseScore + capacityScore + qualityMetricScore))
    : 0;

  return {
    resource,
    isEligible,
    disqualificationReasons,
    totalScore,
    breakdown: {
      languagePairScore,
      domainExpertiseScore,
      capacityScore,
      qualityMetricScore,
    },
    explanations,
  };
}

export function rankCandidatesForProject(
  resources: LinguisticResource[],
  project: TranslationProject,
  settings: OperationalSettings
): CandidateMatchScore[] {
  const scored = resources.map((r) => calculateCandidateMatch(r, project, settings));

  // Sort eligible candidates by totalScore desc, then ineligible
  return scored.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return b.totalScore - a.totalScore;
  });
}
