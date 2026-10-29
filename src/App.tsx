import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { NewProjectPage } from './pages/NewProjectPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { ResourceDetailPage } from './pages/ResourceDetailPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { FilesPage } from './pages/FilesPage';
import { CalendarPage } from './pages/CalendarPage';
import { QualityPage } from './pages/QualityPage';
import { CommunicationsPage } from './pages/CommunicationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersSettingsPage } from './pages/UsersSettingsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Operational Shell Routes */}
        <Route
          path="/dashboard"
          element={
            <Shell>
              <DashboardPage />
            </Shell>
          }
        />
        <Route
          path="/projects"
          element={
            <Shell>
              <ProjectsPage />
            </Shell>
          }
        />
        <Route
          path="/projects/new"
          element={
            <Shell>
              <NewProjectPage />
            </Shell>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <Shell>
              <ProjectDetailPage />
            </Shell>
          }
        />
        <Route
          path="/resources"
          element={
            <Shell>
              <ResourcesPage />
            </Shell>
          }
        />
        <Route
          path="/resources/:id"
          element={
            <Shell>
              <ResourceDetailPage />
            </Shell>
          }
        />
        <Route
          path="/assignments"
          element={
            <Shell>
              <AssignmentsPage />
            </Shell>
          }
        />
        <Route
          path="/files"
          element={
            <Shell>
              <FilesPage />
            </Shell>
          }
        />
        <Route
          path="/calendar"
          element={
            <Shell>
              <CalendarPage />
            </Shell>
          }
        />
        <Route
          path="/quality"
          element={
            <Shell>
              <QualityPage />
            </Shell>
          }
        />
        <Route
          path="/communications"
          element={
            <Shell>
              <CommunicationsPage />
            </Shell>
          }
        />
        <Route
          path="/reports"
          element={
            <Shell>
              <ReportsPage />
            </Shell>
          }
        />
        <Route
          path="/settings/users"
          element={
            <Shell>
              <UsersSettingsPage />
            </Shell>
          }
        />
        <Route
          path="/settings"
          element={
            <Shell>
              <SettingsPage />
            </Shell>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
