import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SEED_PROJECTS,
  SEED_RESOURCES,
  SEED_ASSIGNMENTS,
  SEED_QUALITY_ISSUES,
  SEED_QUALITY_CHECKLISTS,
  SEED_COMMUNICATIONS,
  SEED_FILES,
  SEED_SETTINGS,
  SEED_USERS,
  SEED_CLIENTS,
} from './src/data/seedData';
import { analyzeFileContent } from './src/lib/fileAnalyzer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseSchema {
  projects: typeof SEED_PROJECTS;
  resources: typeof SEED_RESOURCES;
  assignments: typeof SEED_ASSIGNMENTS;
  qualityIssues: typeof SEED_QUALITY_ISSUES;
  qualityChecklists: typeof SEED_QUALITY_CHECKLISTS;
  communications: typeof SEED_COMMUNICATIONS;
  files: typeof SEED_FILES;
  settings: typeof SEED_SETTINGS;
  users: typeof SEED_USERS;
  clients: typeof SEED_CLIENTS;
}

function getInitialDb(): DatabaseSchema {
  return {
    projects: JSON.parse(JSON.stringify(SEED_PROJECTS)),
    resources: JSON.parse(JSON.stringify(SEED_RESOURCES)),
    assignments: JSON.parse(JSON.stringify(SEED_ASSIGNMENTS)),
    qualityIssues: JSON.parse(JSON.stringify(SEED_QUALITY_ISSUES)),
    qualityChecklists: JSON.parse(JSON.stringify(SEED_QUALITY_CHECKLISTS)),
    communications: JSON.parse(JSON.stringify(SEED_COMMUNICATIONS)),
    files: JSON.parse(JSON.stringify(SEED_FILES)),
    settings: JSON.parse(JSON.stringify(SEED_SETTINGS)),
    users: JSON.parse(JSON.stringify(SEED_USERS)),
    clients: JSON.parse(JSON.stringify(SEED_CLIENTS)),
  };
}

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json, re-initializing seed:', err);
    const initial = getInitialDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // REST API Endpoints under /api/v1
  const router = express.Router();

  // Health
  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'LinguaFlow — Localization Project & Resource Coordination Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected (Postgres/JSON persistence engine)',
    });
  });

  // Auth / Users
  router.get('/users', (req, res) => {
    const db = readDb();
    res.json(db.users);
  });

  router.post('/auth/login', (req, res) => {
    const { email } = req.body;
    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase()) || db.users[0];
    res.json({ token: `token-${user.id}-${Date.now()}`, user });
  });

  router.get('/auth/me', (req, res) => {
    const db = readDb();
    res.json(db.users[0]);
  });

  // Clients
  router.get('/clients', (req, res) => {
    const db = readDb();
    res.json(db.clients);
  });

  // Settings
  router.get('/settings', (req, res) => {
    const db = readDb();
    res.json(db.settings);
  });

  router.put('/settings', (req, res) => {
    const db = readDb();
    db.settings = { ...db.settings, ...req.body };
    writeDb(db);
    res.json(db.settings);
  });

  // Projects
  router.get('/projects', (req, res) => {
    const db = readDb();
    let list = [...db.projects];
    const { status, clientId, domain, priority, search } = req.query;

    if (status && status !== 'ALL') {
      list = list.filter((p) => p.status === status);
    }
    if (clientId && clientId !== 'ALL') {
      list = list.filter((p) => p.clientId === clientId);
    }
    if (domain && domain !== 'ALL') {
      list = list.filter((p) => p.domain === domain);
    }
    if (priority && priority !== 'ALL') {
      list = list.filter((p) => p.priority === priority);
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.reference.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q)
      );
    }
    res.json(list);
  });

  router.get('/projects/:id', (req, res) => {
    const db = readDb();
    const found = db.projects.find((p) => p.id === req.params.id || p.reference === req.params.id);
    if (!found) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(found);
  });

  router.post('/projects', (req, res) => {
    const db = readDb();
    const data = req.body;
    const refNum = 100 + db.projects.length + 1;
    const client = db.clients.find((c) => c.id === data.clientId) || db.clients[0];

    const newProject = {
      id: `proj-${Date.now()}`,
      reference: `LF-2026-0${refNum}`,
      name: data.name || 'Untitled Project',
      clientId: client.id,
      clientName: client.name,
      coordinatorId: data.coordinatorId || db.users[0].id,
      coordinatorName: data.coordinatorName || db.users[0].name,
      description: data.description || '',
      sourceLanguage: data.sourceLanguage || 'EN-US',
      targetLanguages: data.targetLanguages || ['DE-DE'],
      domain: data.domain || 'GENERAL',
      wordCount: Number(data.wordCount) || 1000,
      fileCount: Number(data.fileCount) || 1,
      priority: data.priority || 'MEDIUM',
      createdAt: new Date().toISOString(),
      requestedStartDate: data.requestedStartDate || new Date().toISOString(),
      deliveryDeadline: data.deliveryDeadline || new Date(Date.now() + 86400000 * 5).toISOString(),
      tmRequirement: data.tmRequirement || 'Corporate Central Translation Memory',
      glossaryRequirement: data.glossaryRequirement || 'Standard Domain Termbase v2.0',
      customerInstructions: data.customerInstructions || '',
      status: 'REQUEST_RECEIVED' as const,
      riskStatus: 'ON_TRACK' as const,
      estimatedEffortHours: Math.round(((Number(data.wordCount) || 1000) / 300) * 10) / 10,
      internalNotes: data.internalNotes || '',
      progressPercent: 0,
      deliveryChecklist: {
        filesReceived: true,
        filePrepComplete: false,
        tmApplied: false,
        glossaryChecked: false,
        translationComplete: false,
        reviewComplete: false,
        qaIssuesResolved: false,
        clientSignOff: false,
      },
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'PROJECT_CREATED',
          userId: db.users[0].id,
          userName: db.users[0].name,
          notes: 'Project record created by Resource Coordinator.',
        },
      ],
    };

    db.projects.unshift(newProject);
    writeDb(db);
    res.status(201).json(newProject);
  });

  router.patch('/projects/:id', (req, res) => {
    const db = readDb();
    const idx = db.projects.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    db.projects[idx] = { ...db.projects[idx], ...req.body };
    writeDb(db);
    res.json(db.projects[idx]);
  });

  router.post('/projects/:id/status', (req, res) => {
    const db = readDb();
    const idx = db.projects.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    const { status, reason, user } = req.body;
    const proj = db.projects[idx];
    const oldStatus = proj.status;

    let holdReason = proj.holdReason;
    let prevStatus = proj.previousStatusBeforeHold;
    if (status === 'ON_HOLD') {
      prevStatus = oldStatus;
      holdReason = reason || 'Placed on hold.';
    } else if (oldStatus === 'ON_HOLD') {
      holdReason = undefined;
    }

    const checklist = { ...proj.deliveryChecklist };
    if (status === 'COMPLETED') {
      checklist.clientSignOff = true;
      proj.actualDeliveredAt = new Date().toISOString();
      proj.progressPercent = 100;
    }

    const updated = {
      ...proj,
      status,
      holdReason,
      previousStatusBeforeHold: prevStatus,
      deliveryChecklist: checklist,
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          fromStatus: oldStatus,
          toStatus: status,
          action: status === 'ON_HOLD' ? 'PROJECT_PLACED_ON_HOLD' : 'STATUS_CHANGED',
          userId: user?.id || db.users[0].id,
          userName: user?.name || db.users[0].name,
          notes: reason || `Status updated from ${oldStatus} to ${status}`,
        },
        ...proj.activityHistory,
      ],
    };

    db.projects[idx] = updated;
    writeDb(db);
    res.json(updated);
  });

  // Resources
  router.get('/resources', (req, res) => {
    const db = readDb();
    let list = [...db.resources];
    const { search, specialty, availability } = req.query;

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (r) =>
          r.displayName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q)
      );
    }
    if (specialty && specialty !== 'ALL') {
      list = list.filter((r) => r.specialties.includes(specialty as any));
    }
    if (availability && availability !== 'ALL') {
      list = list.filter((r) => r.availabilityStatus === availability);
    }
    res.json(list);
  });

  router.get('/resources/:id', (req, res) => {
    const db = readDb();
    const found = db.resources.find((r) => r.id === req.params.id);
    if (!found) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
    res.json(found);
  });

  router.patch('/resources/:id', (req, res) => {
    const db = readDb();
    const idx = db.resources.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
    db.resources[idx] = { ...db.resources[idx], ...req.body };
    writeDb(db);
    res.json(db.resources[idx]);
  });

  // Assignments
  router.get('/assignments', (req, res) => {
    const db = readDb();
    res.json(db.assignments);
  });

  router.post('/assignments', (req, res) => {
    const db = readDb();
    const { projectId, resourceId, role, notes, overrideReason, actingUser } = req.body;
    const proj = db.projects.find((p) => p.id === projectId);
    const resrc = db.resources.find((r) => r.id === resourceId);

    if (!proj || !resrc) {
      res.status(400).json({ error: 'Project or Resource not found' });
      return;
    }

    const refNum = db.assignments.length + 1;
    const newAsg = {
      id: `asg-${Date.now()}`,
      reference: `ASG-2026-0${refNum}`,
      projectId: proj.id,
      projectReference: proj.reference,
      projectName: proj.name,
      resourceId: resrc.id,
      resourceName: resrc.displayName,
      role: role || 'TRANSLATOR',
      languagePair: `${proj.sourceLanguage} -> ${proj.targetLanguages.join(', ')}`,
      assignedWordCount: proj.wordCount,
      estimatedEffortHours: Math.round((proj.wordCount / (role === 'TRANSLATOR' ? 300 : 1000)) * 10) / 10,
      assignedDate: new Date().toISOString(),
      expectedStartDate: proj.requestedStartDate,
      expectedCompletionDate: proj.deliveryDeadline,
      status: 'IN_PROGRESS' as const,
      progressPercent: 0,
      deadlineRisk: 'LOW' as const,
      notes: notes || (overrideReason ? `Authorized Override: ${overrideReason}` : 'Assigned via transparent matching engine.'),
    };

    db.assignments.unshift(newAsg);

    if (role === 'TRANSLATOR') {
      proj.assignedTranslatorId = resrc.id;
      proj.assignedTranslatorName = resrc.displayName;
    } else {
      proj.assignedReviewerId = resrc.id;
      proj.assignedReviewerName = resrc.displayName;
    }

    if (proj.status === 'RESOURCE_ASSIGNMENT') {
      proj.status = 'TRANSLATION';
    }

    proj.activityHistory.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'RESOURCE_ASSIGNED',
      userId: actingUser?.id || db.users[0].id,
      userName: actingUser?.name || db.users[0].name,
      notes: `Assigned ${resrc.displayName} as ${role} (${newAsg.reference}). ${overrideReason ? `[Override: ${overrideReason}]` : ''}`,
    });

    resrc.currentWorkloadWords += proj.wordCount;
    writeDb(db);
    res.status(201).json(newAsg);
  });

  // Files
  router.get('/files', (req, res) => {
    const db = readDb();
    const { projectId } = req.query;
    if (projectId) {
      res.json(db.files.filter((f) => f.projectId === projectId));
    } else {
      res.json(db.files);
    }
  });

  router.post('/files/analyze', (req, res) => {
    const db = readDb();
    const { fileContent, fileName, projectId } = req.body;
    const analysis = analyzeFileContent(fileContent || '', fileName || 'sample.txt');
    const isCsv = (fileName || '').toLowerCase().endsWith('.csv');

    const newFile = {
      id: `fil-${Date.now()}`,
      projectId,
      fileName: fileName || 'uploaded_source.txt',
      fileSizeFormatted: `${(Buffer.byteLength(fileContent || '', 'utf8') / 1024).toFixed(1)} KB`,
      format: (isCsv ? 'CSV' : 'TXT') as any,
      uploadedAt: new Date().toISOString(),
      wordCount: analysis.wordCount,
      characterCount: analysis.characterCount,
      characterCountNoSpaces: analysis.characterCountNoSpaces,
      lineCount: analysis.lineCount,
      encoding: analysis.encoding,
      isUtf8Valid: analysis.isUtf8Valid,
      isEmpty: analysis.isEmpty,
      duplicateSegmentsFound: analysis.duplicateSegmentsFound,
      readinessStatus: 'PENDING_REVIEW' as const,
      samplePreview: analysis.samplePreview,
      checklist: {
        filesReceived: true,
        readable: !analysis.isEmpty,
        languageVerified: false,
        referencesIdentified: false,
        instructionsPrepared: false,
        glossaryDocumented: false,
        wordCountReviewed: true,
        deliveryRequirementsRecorded: false,
      },
    };

    db.files.unshift(newFile);

    const proj = db.projects.find((p) => p.id === projectId);
    if (proj) {
      proj.fileCount += 1;
      proj.wordCount += analysis.wordCount;
      proj.estimatedEffortHours = Math.round((proj.wordCount / 300) * 10) / 10;
      if (proj.status === 'REQUEST_RECEIVED') {
        proj.status = 'FILE_PREPARATION';
      }
    }

    writeDb(db);
    res.status(201).json(newFile);
  });

  router.post('/files/:id/checklist', (req, res) => {
    const db = readDb();
    const file = db.files.find((f) => f.id === req.params.id);
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    const { checklistKey, val } = req.body;
    (file.checklist as any)[checklistKey] = val;

    const allChecked = Object.values(file.checklist).every(Boolean);
    file.readinessStatus = allChecked ? 'PREPARED_READY' : 'PENDING_REVIEW';

    const projectFiles = db.files.filter((f) => f.projectId === file.projectId);
    const allFilesReady = projectFiles.every((f) => f.readinessStatus === 'PREPARED_READY');
    const proj = db.projects.find((p) => p.id === file.projectId);
    if (proj && allFilesReady) {
      proj.deliveryChecklist.filePrepComplete = true;
      if (proj.status === 'FILE_PREPARATION') {
        proj.status = 'RESOURCE_ASSIGNMENT';
      }
    }

    writeDb(db);
    res.json(file);
  });

  // Quality Issues
  router.get('/quality/issues', (req, res) => {
    const db = readDb();
    const { projectId } = req.query;
    if (projectId) {
      res.json(db.qualityIssues.filter((q) => q.projectId === projectId));
    } else {
      res.json(db.qualityIssues);
    }
  });

  router.post('/quality/issues', (req, res) => {
    const db = readDb();
    const data = req.body;
    const count = db.qualityIssues.length + 1;
    const newIssue = {
      id: `iss-${Date.now()}`,
      reference: `QA-ISS-0${40 + count}`,
      projectId: data.projectId || db.projects[0].id,
      projectReference: data.projectReference || db.projects[0].reference,
      projectName: data.projectName || db.projects[0].name,
      category: data.category || 'TERMINOLOGY',
      severity: data.severity || 'MAJOR',
      description: data.description || '',
      sourceSegment: data.sourceSegment || '',
      targetSegment: data.targetSegment || '',
      suggestedCorrection: data.suggestedCorrection || '',
      reporterId: data.reporterId || db.users[0].id,
      reporterName: data.reporterName || db.users[0].name,
      assignedOwnerId: data.assignedOwnerId || db.resources[0].id,
      assignedOwnerName: data.assignedOwnerName || db.resources[0].displayName,
      status: 'OPEN' as const,
      createdAt: new Date().toISOString(),
    };

    db.qualityIssues.unshift(newIssue);
    writeDb(db);
    res.status(201).json(newIssue);
  });

  router.patch('/quality/issues/:id', (req, res) => {
    const db = readDb();
    const idx = db.qualityIssues.findIndex((q) => q.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Issue not found' });
      return;
    }
    const updated = { ...db.qualityIssues[idx], ...req.body };
    if (req.body.status === 'RESOLVED' || req.body.status === 'ACCEPTED_WITH_JUSTIFICATION') {
      updated.resolvedAt = new Date().toISOString();
    }
    db.qualityIssues[idx] = updated;
    writeDb(db);
    res.json(updated);
  });

  // Communications
  router.get('/communications', (req, res) => {
    const db = readDb();
    const { projectId } = req.query;
    if (projectId) {
      res.json(db.communications.filter((c) => c.projectId === projectId));
    } else {
      res.json(db.communications);
    }
  });

  router.post('/communications', (req, res) => {
    const db = readDb();
    const draft = req.body;
    const existingIdx = db.communications.findIndex((c) => c.id === draft.id);
    if (existingIdx !== -1) {
      db.communications[existingIdx] = draft;
    } else {
      db.communications.unshift(draft);
    }
    writeDb(db);
    res.json(draft);
  });

  // Dashboard Metrics
  router.get('/dashboard/metrics', (req, res) => {
    const db = readDb();
    const active = db.projects.filter((p) => p.status !== 'COMPLETED');
    const completed = db.projects.filter((p) => p.status === 'COMPLETED');

    const onTimeDelivered = completed.filter((p) => {
      if (!p.actualDeliveredAt) return true;
      return new Date(p.actualDeliveredAt).getTime() <= new Date(p.deliveryDeadline).getTime();
    }).length;

    const onTimeDeliveryRate =
      completed.length > 0 ? Math.round((onTimeDelivered / completed.length) * 100) : 100;

    const availableResources = db.resources.filter(
      (r) => r.availabilityStatus === 'AVAILABLE' && r.qualificationStatus === 'VERIFIED'
    ).length;

    const openIssues = db.qualityIssues.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;

    res.json({
      totalActiveProjects: active.length,
      awaitingFilePrep: active.filter((p) => p.status === 'FILE_PREPARATION').length,
      awaitingResourceAssignment: active.filter((p) => p.status === 'RESOURCE_ASSIGNMENT').length,
      inTranslation: active.filter((p) => p.status === 'TRANSLATION').length,
      awaitingLinguisticReview: active.filter((p) => p.status === 'LINGUISTIC_REVIEW').length,
      approachingDeadlines: active.filter((p) => p.riskStatus === 'AT_RISK').length,
      overdueProjects: active.filter((p) => p.riskStatus === 'CRITICAL_OVERDUE').length,
      deliveredOnTimeCount: onTimeDelivered,
      onTimeDeliveryRate,
      availableResourcesCount: availableResources,
      openQualityIssuesCount: openIssues,
      avgTurnaroundDays: 4.8,
      avgAssignmentTurnaroundHours: 3.2,
    });
  });

  // Reset database endpoint
  router.post('/database/reset', (req, res) => {
    const initial = getInitialDb();
    writeDb(initial);
    res.json({ success: true, message: 'Database reset to initial demo seeds.' });
  });

  app.use('/api/v1', router);

  // Vite dev middleware or static serving
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LinguaFlow server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start LinguaFlow server:', err);
  process.exit(1);
});
