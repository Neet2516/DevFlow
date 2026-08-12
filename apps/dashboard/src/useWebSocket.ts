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

  // ── Always-on connection: connect on mount, reconnect on drop ──
  useEffect(() => {
    let ws: WebSocket;
    let retryTimer: ReturnType<typeof setTimeout>;
    let destroyed = false;

    function connect() {
      if (destroyed) return;

      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        // Re-subscribe to active execution if one exists
        if (executionId) {
          ws.send(JSON.stringify({ type: 'subscribe', executionId }));
        }
      };

      ws.onmessage = handleEvent;

      ws.onerror = () => {
        setWsConnected(false);
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Auto-reconnect after 3s
        if (!destroyed) {
          retryTimer = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      clearTimeout(retryTimer);
      if (ws && ws.readyState === WebSocket.OPEN) {
        if (executionId) {
          ws.send(JSON.stringify({ type: 'unsubscribe', executionId }));
        }
        ws.close();
      }
      setWsConnected(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount/unmount only — connection is persistent

  // ── Subscribe/unsubscribe to execution rooms when executionId changes ──
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    if (executionId) {
      ws.send(JSON.stringify({ type: 'subscribe', executionId }));
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN && executionId) {
        ws.send(JSON.stringify({ type: 'unsubscribe', executionId }));
      }
    };
  }, [executionId]);

  return wsRef;
}
