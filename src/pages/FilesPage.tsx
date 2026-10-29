import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileUp,
  Upload,
  FileText,
  CheckCircle2,
  Download,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { FileAnalysisReport, TranslationProject } from '../types';
import { api } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { generateCatHandoffManifest } from '../lib/fileAnalyzer';

export const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<FileAnalysisReport[]>([]);
  const [projects, setProjects] = useState<TranslationProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const [f, p] = await Promise.all([api.getFiles(), api.getProjects()]);
      setFiles(f);
      setProjects(p);
      if (p.length > 0) setTargetProjectId(p[0].id);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProjectId || !fileName || !fileContent) return;
    try {
      await api.uploadAndAnalyzeFile(fileContent, fileName, targetProjectId);
      setIsUploadModalOpen(false);
      setFileName('');
      setFileContent('');
      loadFiles();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleToggleChecklist = async (
    fileId: string,
    key: keyof FileAnalysisReport['checklist'],
    val: boolean
  ) => {
    try {
      await api.updateFileChecklist(fileId, key, !val);
      loadFiles();
    } catch (err) {
      console.error('Checklist update failed:', err);
    }
  };

  const handleDownloadHandoff = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    const projectFiles = files.filter((f) => f.projectId === projectId);
    const { textManifest } = generateCatHandoffManifest(proj, projectFiles);

    const blob = new Blob([textManifest], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${proj.reference}_CAT_Handoff_Package.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileUp className="w-5 h-5 text-indigo-600" />
            Source-File Analysis &amp; Preparation Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest source TXT/CSV files, calculate token word counts, verify UTF-8 integrity, and compile CAT handoff manifests.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload &amp; Analyze Source File</span>
        </button>
      </div>

      {/* Files Grid */}
      <div className="space-y-4">
        {files.map((file) => {
          const associatedProject = projects.find((p) => p.id === file.projectId);

          return (
            <div
              key={file.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">{file.fileName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {file.format}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        file.readinessStatus === 'PREPARED_READY'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {file.readinessStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span>Project:</span>
                    {associatedProject ? (
                      <Link
                        to={`/projects/${associatedProject.id}`}
                        className="font-semibold text-indigo-600 hover:underline"
                      >
                        {associatedProject.reference} ({associatedProject.name})
                      </Link>
                    ) : (
                      <span className="font-mono text-slate-400">Unlinked Project</span>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-xs font-mono self-start sm:self-auto">
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Word Count</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {file.wordCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Lines</span>
                    <span className="font-semibold text-slate-700">{file.lineCount}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Encoding</span>
                    <span className="font-semibold text-emerald-600">UTF-8 Strict</span>
                  </div>
                </div>
              </div>

              {/* Sample Content Snippet */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-24 overflow-y-auto">
                {file.samplePreview}
              </div>

              {/* 8-Step Preparation Verification Checklist */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                  Readiness Verification Checklist
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  {[
                    { key: 'filesReceived', label: '1. Files received & readable' },
                    { key: 'readable', label: '2. Non-corrupt format integrity' },
                    { key: 'languageVerified', label: '3. Source language verified' },
                    { key: 'referencesIdentified', label: '4. Reference materials mapped' },
                    { key: 'instructionsPrepared', label: '5. Instructions prepared' },
                    { key: 'glossaryDocumented', label: '6. Glossary terms documented' },
                    { key: 'wordCountReviewed', label: '7. Word count reviewed' },
                    { key: 'deliveryRequirementsRecorded', label: '8. Delivery specs locked' },
                  ].map(({ key, label }) => {
                    const isChecked = (file.checklist as any)[key];
                    return (
                      <button
                        key={key}
                        onClick={() =>
                          handleToggleChecklist(file.id, key as keyof FileAnalysisReport['checklist'], isChecked)
                        }
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[11px] truncate">{label}</span>
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ml-1.5 ${
                            isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              {associatedProject && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleDownloadHandoff(associatedProject.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download CAT Handoff Manifest</span>
                  </button>
                  <Link
                    to={`/projects/${associatedProject.id}?tab=matching`}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Proceed to Matching</span>
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Upload & Ingest */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload &amp; Analyze Source File"
        description="Ingest translatable content, tokenize words, and verify encoding integrity."
      >
        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assign to Translation Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={targetProjectId}
              onChange={(e) => setTargetProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-900 font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} — {p.name} ({p.clientName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              File Name (e.g. source_strings.csv or documentation.txt) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. Mobile_UI_Strings_Q4.csv"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              File Content (Plain text or CSV segment records) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={6}
              required
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="Segment_ID,Source_String_EN,Notes\n001,&quot;Click to accept cookies&quot;,Privacy modal\n002,&quot;Manage billing subscription&quot;,Account settings"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fileName || !fileContent}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Analyze &amp; Ingest
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
