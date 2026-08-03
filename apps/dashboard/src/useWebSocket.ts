import { useEffect, useRef, useCallback } from 'react';
import { useStore } from './store';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3003';

export function useWebSocket(executionId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const { setWsConnected, updateJobStatus, appendLogLine } = useStore();

  const handleEvent = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'subscribed') return;

      if (data.type === 'job.started') {
        updateJobStatus(data.jobId, 'running');
      } else if (data.type === 'job.completed') {
        updateJobStatus(data.jobId, 'succeeded');
      } else if (data.type === 'job.failed') {
        updateJobStatus(data.jobId, 'failed_terminal');
      } else if (data.type === 'job.retried') {
        updateJobStatus(data.jobId, 'retrying');
      } else if (data.type === 'log.line') {
        appendLogLine({
          jobId: data.jobId,
          jobExecutionId: data.jobExecutionId,
          lineNumber: data.lineNumber,
          line: data.line,
          timestamp: data.timestamp,
        });
      }
    } catch {
      // ignore non-JSON messages
    }
  }, [updateJobStatus, appendLogLine]);

  useEffect(() => {
    if (!executionId) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(JSON.stringify({ type: 'subscribe', executionId }));
    };

    ws.onmessage = handleEvent;

    ws.onerror = () => setWsConnected(false);

    ws.onclose = () => setWsConnected(false);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe', executionId }));
        ws.close();
      }
      setWsConnected(false);
    };
  }, [executionId, handleEvent, setWsConnected]);

  return wsRef;
}
