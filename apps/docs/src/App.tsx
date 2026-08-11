import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import DocsLayout from './components/DocsLayout';
import HomePage from './pages/HomePage';
import IntroductionPage from './pages/IntroductionPage';
import QuickStartPage from './pages/QuickStartPage';
import InstallationPage from './pages/InstallationPage';
import RequirementsPage from './pages/RequirementsPage';
import ArchitecturePage from './pages/ArchitecturePage';
import MonorepoPage from './pages/MonorepoPage';
import TechStackPage from './pages/TechStackPage';
import DagExecutionPage from './pages/DagExecutionPage';
import WorkflowEnginePage from './pages/WorkflowEnginePage';
import ApiOverviewPage from './pages/ApiOverviewPage';
import PipelinesApiPage from './pages/PipelinesApiPage';
import ExecutionsApiPage from './pages/ExecutionsApiPage';
import WebSocketApiPage from './pages/WebSocketApiPage';
import WorkersPage from './pages/WorkersPage';
import FailureRecoveryPage from './pages/FailureRecoveryPage';
import SecurityPage from './pages/SecurityPage';
import ConfigurationPage from './pages/ConfigurationPage';
import DevelopmentPage from './pages/DevelopmentPage';
import TestingPage from './pages/TestingPage';
import ContributingPage from './pages/ContributingPage';
import {
  EventBusPage, AiAnalyzerPage, DockerPage,
  DomainModelPage, StateMachinePage, SchedulerPage,
  ObservabilityPage, RoadmapPage, LicensePage,
} from './pages/AdditionalPages';

// 404
const NotFoundPage: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-32 text-center">
    <p className="text-6xl font-extrabold text-slate-200 dark:text-slate-700 mb-4">404</p>
    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Page not found</h1>
    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">This documentation page doesn't exist yet.</p>
    <a href="/" className="text-brand-600 dark:text-brand-400 text-sm hover:underline">← Back to home</a>
  </div>
);

const App: React.FC = () => (
  <ThemeProvider>
    <BrowserRouter>
      <Routes>
        {/* Homepage — no docs layout */}
        <Route path="/" element={<HomePage />} />

        {/* Docs layout wrapper */}
        <Route path="/docs" element={<DocsLayout />}>
          {/* Redirect /docs → /docs/introduction */}
          <Route index element={<Navigate to="/docs/introduction" replace />} />

          {/* Getting Started */}
          <Route path="introduction"    element={<IntroductionPage />} />
          <Route path="quickstart"      element={<QuickStartPage />} />
          <Route path="installation"    element={<InstallationPage />} />
          <Route path="requirements"    element={<RequirementsPage />} />

          {/* Architecture */}
          <Route path="architecture"    element={<ArchitecturePage />} />
          <Route path="monorepo"        element={<MonorepoPage />} />
          <Route path="domain-model"    element={<DomainModelPage />} />
          <Route path="tech-stack"      element={<TechStackPage />} />

          {/* Core Concepts */}
          <Route path="dag-execution"   element={<DagExecutionPage />} />
          <Route path="workflow-engine" element={<WorkflowEnginePage />} />
          <Route path="event-bus"       element={<EventBusPage />} />
          <Route path="workers"         element={<WorkersPage />} />
          <Route path="scheduler"       element={<SchedulerPage />} />
          <Route path="state-machine"   element={<StateMachinePage />} />

          {/* API Reference */}
          <Route path="api"             element={<ApiOverviewPage />} />
          <Route path="api/pipelines"   element={<PipelinesApiPage />} />
          <Route path="api/executions"  element={<ExecutionsApiPage />} />
          <Route path="api/websocket"   element={<WebSocketApiPage />} />

          {/* Features */}
          <Route path="failure-recovery" element={<FailureRecoveryPage />} />
          <Route path="security"         element={<SecurityPage />} />
          <Route path="ai-analyzer"      element={<AiAnalyzerPage />} />
          <Route path="observability"    element={<ObservabilityPage />} />

          {/* Configuration */}
          <Route path="configuration"   element={<ConfigurationPage />} />
          <Route path="docker"          element={<DockerPage />} />

          {/* Development */}
          <Route path="development"     element={<DevelopmentPage />} />
          <Route path="testing"         element={<TestingPage />} />
          <Route path="contributing"    element={<ContributingPage />} />

          {/* Project */}
          <Route path="roadmap"         element={<RoadmapPage />} />
          <Route path="license"         element={<LicensePage />} />

          {/* 404 within docs */}
          <Route path="*"               element={<NotFoundPage />} />
        </Route>

        {/* Global 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
