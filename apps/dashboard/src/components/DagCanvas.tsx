import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'motion/react';
import DagNode from './DagNode';
import { useStore, type JobStatus } from '../store';

const nodeTypes = { dagNode: DagNode };

interface Job {
  id: string;
  name: string;
  type: string;
  dependsOn: string[];
}

interface DagCanvasProps {
  jobs: Job[];
  jobExecutions: Array<{ jobId: string; status: JobStatus }>;
}

// BFS hierarchical layout
function layoutNodes(jobs: Job[]): Node[] {
  if (!jobs.length) return [];

  const levels = new Map<string, number>();
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const j of jobs) {
    inDegree.set(j.id, j.dependsOn.length);
    for (const dep of j.dependsOn) {
      if (!children.has(dep)) children.set(dep, []);
      children.get(dep)!.push(j.id);
    }
  }

  const queue = jobs.filter((j) => j.dependsOn.length === 0).map((j) => j.id);
  queue.forEach((id) => levels.set(id, 0));

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    for (const child of children.get(cur) || []) {
      const lvl = Math.max(levels.get(child) || 0, (levels.get(cur) || 0) + 1);
      levels.set(child, lvl);
      const deg = (inDegree.get(child) || 1) - 1;
      inDegree.set(child, deg);
      if (deg === 0) queue.push(child);
    }
  }

  const byLevel = new Map<number, string[]>();
  for (const [id, lvl] of levels) {
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl)!.push(id);
  }

  const HGAP = 280;
  const VGAP = 130;
  const nodes: Node[] = [];

  for (const [lvl, ids] of byLevel) {
    const totalH = (ids.length - 1) * VGAP;
    ids.forEach((id, idx) => {
      const job = jobs.find((j) => j.id === id)!;
      nodes.push({
        id,
        type: 'dagNode',
        position: { x: lvl * HGAP + 60, y: idx * VGAP - totalH / 2 + 200 },
        data: { label: job.name, type: job.type, jobId: id, status: 'pending' as JobStatus },
      });
    });
  }
  return nodes;
}

export default function DagCanvas({ jobs, jobExecutions }: DagCanvasProps) {
  const liveJobStatuses = useStore((s) => s.liveJobStatuses);

  const baseNodes = useMemo(() => layoutNodes(jobs), [jobs]);

  const nodes: Node[] = useMemo(() =>
    baseNodes.map((n) => {
      const liveStatus = liveJobStatuses[n.id as string];
      const dbJe = jobExecutions.find((je) =>
        je.jobId === n.id || je.jobId.endsWith(`_${n.id}`)
      );
      const status = liveStatus || dbJe?.status || 'pending';
      return { ...n, data: { ...n.data, status } };
    }),
    [baseNodes, jobExecutions, liveJobStatuses]
  );

  const edges: Edge[] = useMemo(() =>
    jobs.flatMap((j) =>
      j.dependsOn.map((dep) => ({
        id: `${dep}->${j.id}`,
        source: dep,
        target: j.id,
        animated:
          liveJobStatuses[dep] === 'running' ||
          liveJobStatuses[j.id] === 'running',
      }))
    ),
    [jobs, liveJobStatuses]
  );

  return (
    <motion.div
      className="dag-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.35, maxZoom: 1.4 }}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="rgba(148,163,184,0.06)"
          gap={28}
          size={1.5}
        />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const s = (n.data as any)?.status;
            if (s === 'succeeded') return '#22c55e';
            if (s === 'running') return '#3b82f6';
            if (s === 'failed_terminal' || s === 'failed') return '#ef4444';
            if (s === 'retrying') return '#8b5cf6';
            if (s === 'skipped') return '#f59e0b';
            return '#1a2236';
          }}
          maskColor="rgba(6,8,16,0.85)"
          pannable
          zoomable
        />
      </ReactFlow>
    </motion.div>
  );
}
