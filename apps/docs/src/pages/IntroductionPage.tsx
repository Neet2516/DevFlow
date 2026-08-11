import React from 'react';
import DocPage from '../components/DocPage';
import CodeBlock from '../components/CodeBlock';
import Callout from '../components/Callout';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const TOC = [
  { id: 'what-is-devflow', text: 'What is DevFlow?', level: 2 },
  { id: 'why-devflow', text: 'Why DevFlow?', level: 2 },
  { id: 'how-it-works', text: 'How it works', level: 2 },
  { id: 'key-concepts', text: 'Key concepts', level: 2 },
  { id: 'next-steps', text: 'Next steps', level: 2 },
];

const IntroductionPage: React.FC = () => (
  <DocPage
    title="Introduction"
    description="DevFlow is a production-grade, distributed workflow orchestration platform for CI/CD pipelines."
    toc={TOC}
  >

    <h2 id="what-is-devflow">What is DevFlow?</h2>
    <p>
      DevFlow is a modern, high-throughput, fault-tolerant distributed DAG (Directed Acyclic Graph) workflow
      and CI/CD engine. It gives engineering teams a way to define, execute, monitor, and debug complex,
      dependency-aware pipelines across a pool of distributed worker nodes — with real-time visualization
      of execution state.
    </p>
    <p>
      DevFlow is <strong>not</strong> a logs-first CI tool like a typical Jenkins job page. It is a
      graph-first, observability-first system in the spirit of <em>Temporal</em>, <em>Argo Workflows</em>,
      and <em>Dagster</em>, wrapped in a GitHub Actions-style authoring experience.
    </p>

    <h2 id="why-devflow">Why DevFlow?</h2>
    <p>Traditional CI/CD tools fall short in several ways:</p>
    <ul>
      <li><strong>Sequential-only execution</strong> — can't express parallel test suites or fan-in deploy gates natively.</li>
      <li><strong>Opaque logs</strong> — you refresh and hope; no live state visualization during execution.</li>
      <li><strong>Fragile failure handling</strong> — a crashed runner often leaves the whole pipeline hanging.</li>
      <li><strong>No replay or audit</strong> — you can't re-run an exact past execution for debugging.</li>
    </ul>
    <p>DevFlow addresses all of these with first-class design decisions baked in from day one.</p>

    <Callout type="tip" title="Graph-first philosophy">
      The DAG — not a list of steps — is the runtime source of truth. Every feature, from execution replay to
      AI failure triage, is built on top of this foundation.
    </Callout>

    <h2 id="how-it-works">How it works</h2>
    <p>At a high level, DevFlow follows a clear data flow:</p>
    <ol>
      <li>A developer defines a pipeline as a DAG of jobs via the Dashboard or REST API.</li>
      <li>The <strong>Pipeline Engine</strong> validates the DAG (cycle detection, reference integrity) and stores it.</li>
      <li>On execution trigger, the <strong>Scheduler</strong> walks the DAG and enqueues root nodes (no dependencies) via Redis Streams.</li>
      <li>Specialized <strong>Worker Nodes</strong> pull jobs matching their type, execute them in isolated environments, and stream logs.</li>
      <li>State transitions are published to the <strong>Event Bus</strong> (Redis Streams), which fans out to the database, WebSocket Gateway, and Notification Service.</li>
      <li>The <strong>Dashboard</strong> receives real-time updates and reflects live execution state on the DAG visualization.</li>
    </ol>

    <h2 id="key-concepts">Key concepts</h2>
    <div className="grid sm:grid-cols-2 gap-3 mt-4">
      {[
        { term: 'Pipeline', def: 'A named, versioned definition of a DAG of jobs.' },
        { term: 'Execution', def: 'A single run of a PipelineVersion, with its own status timeline.' },
        { term: 'Job', def: 'A node within a Pipeline — defines type, retry policy, dependencies.' },
        { term: 'JobExecution', def: 'A single run of a Job within an Execution, mapped to a Worker.' },
        { term: 'Worker', def: 'A stateless execution node that pulls and runs JobExecutions.' },
        { term: 'Event Bus', def: 'The Redis Streams-based integration backbone for all state transitions.' },
      ].map(({ term, def }) => (
        <div key={term} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <p className="font-mono text-sm font-semibold text-brand-600 dark:text-brand-400 mb-0.5">{term}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{def}</p>
        </div>
      ))}
    </div>

    <h2 id="next-steps">Next steps</h2>
    <ul>
      <li>
        <Link to="/docs/quickstart" className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 w-fit">
          Quick Start <ArrowRight size={13} />
        </Link>
      </li>
      <li>
        <Link to="/docs/installation" className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 w-fit">
          Installation Guide <ArrowRight size={13} />
        </Link>
      </li>
      <li>
        <Link to="/docs/architecture" className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 w-fit">
          System Architecture <ArrowRight size={13} />
        </Link>
      </li>
    </ul>
  </DocPage>
);

export default IntroductionPage;
