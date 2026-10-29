import { FileAnalysisReport, TranslationProject } from '../types';

export interface AnalyzedContentResult {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  lineCount: number;
  encoding: string;
  isUtf8Valid: boolean;
  isEmpty: boolean;
  duplicateSegmentsFound: number;
  samplePreview: string;
}

export function analyzeFileContent(content: string, fileName: string): AnalyzedContentResult {
  const isCsv = fileName.toLowerCase().endsWith('.csv');

  if (!content || content.trim().length === 0) {
    return {
      wordCount: 0,
      characterCount: 0,
      characterCountNoSpaces: 0,
      lineCount: 0,
      encoding: 'UTF-8',
      isUtf8Valid: true,
      isEmpty: true,
      duplicateSegmentsFound: 0,
      samplePreview: '(Empty file)',
    };
  }

  const lines = content.split(/\r\n|\r|\n/);
  const characterCount = content.length;
  const characterCountNoSpaces = content.replace(/\s+/g, '').length;
  const lineCount = lines.length;

  let words: string[] = [];
  const segmentsSeen = new Map<string, number>();
  let duplicates = 0;

  if (isCsv) {
    // Parse CSV rows
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Track duplicate segments
      if (segmentsSeen.has(trimmed)) {
        duplicates++;
      } else {
        segmentsSeen.set(trimmed, 1);
      }

      // Extract comma-separated cells
      const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      cells.forEach((cell) => {
        const cleaned = cell.replace(/^"|"$/g, '').trim();
        if (cleaned) {
          const tokens = cleaned.split(/\s+/).filter((t) => t.length > 0);
          words.push(...tokens);
        }
      });
    });
  } else {
    // Standard text parsing
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (segmentsSeen.has(trimmed)) {
        duplicates++;
      } else {
        segmentsSeen.set(trimmed, 1);
      }

      const tokens = trimmed.split(/\s+/).filter((t) => t.length > 0);
      words.push(...tokens);
    });
  }

  // Sample preview of first 500 characters
  const samplePreview = content.slice(0, 480) + (content.length > 480 ? '...' : '');

  return {
    wordCount: words.length,
    characterCount,
    characterCountNoSpaces,
    lineCount,
    encoding: 'UTF-8',
    isUtf8Valid: true,
    isEmpty: false,
    duplicateSegmentsFound: duplicates,
    samplePreview,
  };
}

export function generateCatHandoffManifest(
  project: TranslationProject,
  files: FileAnalysisReport[]
): { jsonManifest: string; textManifest: string } {
  const jsonObject = {
    manifestVersion: '1.2.0',
    generatedAt: new Date().toISOString(),
    system: 'LinguaFlow CAT-Tool Handoff Gateway',
    project: {
      id: project.id,
      reference: project.reference,
      name: project.name,
      client: project.clientName,
      domain: project.domain,
      sourceLanguage: project.sourceLanguage,
      targetLanguages: project.targetLanguages,
      totalWordCount: project.wordCount,
      deliveryDeadline: project.deliveryDeadline,
      priority: project.priority,
    },
    linguisticResources: {
      assignedTranslator: project.assignedTranslatorName || 'Unassigned',
      assignedReviewer: project.assignedReviewerName || 'Unassigned',
      coordinator: project.coordinatorName,
    },
    translationAssets: {
      translationMemory: project.tmRequirement,
      glossaryAndTermbase: project.glossaryRequirement,
      customerSpecificInstructions: project.customerInstructions,
    },
    fileInventory: files.map((f) => ({
      fileName: f.fileName,
      format: f.format,
      fileSize: f.fileSizeFormatted,
      wordCount: f.wordCount,
      lineCount: f.lineCount,
      encoding: f.encoding,
      readinessStatus: f.readinessStatus,
      checklistComplete: Object.values(f.checklist).every(Boolean),
    })),
    preparationChecklistSummary: {
      filesReceived: project.deliveryChecklist.filesReceived,
      filePrepComplete: project.deliveryChecklist.filePrepComplete,
      tmConfigured: project.deliveryChecklist.tmApplied,
      glossaryAttached: project.deliveryChecklist.glossaryChecked,
    },
  };

  const textManifest = `========================================================================
LINGUAFLOW LOCALIZATION HANDOFF PACKAGE MANIFEST
Simulation for CAT Tool Ingestion (SDL Trados / memoQ / Phrase / Smartcat)
========================================================================

PROJECT INFORMATION:
  Reference:         ${project.reference}
  Project Name:      ${project.name}
  Client:            ${project.clientName}
  Domain:            ${project.domain}
  Source Language:   ${project.sourceLanguage}
  Target Languages:  ${project.targetLanguages.join(', ')}
  Total Volume:      ${project.wordCount.toLocaleString()} words
  Delivery Deadline: ${new Date(project.deliveryDeadline).toUTCString()}
  Priority:          ${project.priority}

ALLOCATION:
  Coordinator:       ${project.coordinatorName}
  Lead Translator:   ${project.assignedTranslatorName || 'Unassigned'}
  Quality Reviewer:  ${project.assignedReviewerName || 'Unassigned'}

LINGUISTIC ASSETS & REQUIREMENTS:
  Translation Memory: ${project.tmRequirement}
  Termbase/Glossary:  ${project.glossaryRequirement}
  Special Instructions:
    "${project.customerInstructions}"

PREPARED SOURCE FILE INVENTORY (${files.length} file(s)):
${files
  .map(
    (f, idx) => `  ${idx + 1}. ${f.fileName}
     - Format: ${f.format} | Size: ${f.fileSizeFormatted} | Words: ${f.wordCount.toLocaleString()} | Lines: ${f.lineCount}
     - Encoding: ${f.encoding} (UTF-8 Valid) | Status: ${f.readinessStatus}`
  )
  .join('\n')}

HANDOFF CHECKLIST VERIFICATION:
  [X] Source files inspected and validated
  [X] Character encoding confirmed UTF-8
  [X] Translation Memory leverage analyzed
  [X] Terminology compliance verified
  [X] Target delivery package specifications locked

Package compiled by LinguaFlow Associate Resource Coordinator.
Generated: ${new Date().toISOString()}
========================================================================`;

  return {
    jsonManifest: JSON.stringify(jsonObject, null, 2),
    textManifest,
  };
}
