import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store';
import { fetchTemplates, createPipeline, createPipelineFromTemplate } from '../api';

interface RegisterPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_DAG = `{
  "jobs": [
    {
      "id": "build_job",
      "name": "Build Codebase",
      "type": "build",
      "dependsOn": [],
      "cmd": "echo \\"[BUILD] Building code...\\"; sleep 2; echo \\"[BUILD] Done.\\"",
      "retryPolicy": {
        "maxAttempts": 3,
        "backoff": { "type": "fixed", "baseMs": 1000, "maxMs": 5000 },
        "retryableExitCodes": "any"
      }
    },
    {
      "id": "test_job",
      "name": "Run Tests",
      "type": "test",
      "dependsOn": ["build_job"],
      "cmd": "echo \\"[TEST] Running unit tests...\\"; sleep 1; echo \\"[TEST] Success.\\"",
      "retryPolicy": {
        "maxAttempts": 2,
        "backoff": { "type": "fixed", "baseMs": 1000, "maxMs": 2000 },
        "retryableExitCodes": [1]
      }
    }
  ]
}`;

export default function RegisterPipelineModal({ isOpen, onClose }: RegisterPipelineModalProps) {
  const queryClient = useQueryClient();
  const setActivePipelineId = useStore((s) => s.setActivePipelineId);

  const [activeTab, setActiveTab] = useState<'template' | 'custom'>('template');
  const [name, setName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [dagJson, setDagJson] = useState(DEFAULT_DAG);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{ message: string; details?: string[] } | null>(null);

  // Fetch templates for the template tab
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
    enabled: isOpen && activeTab === 'template',
  });

  // Pre-select the first template when loaded
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  // Reset states on open/close
  useEffect(() => {
    if (isOpen) {
      setName('');
      setErrorDetails(null);
      setDagJson(DEFAULT_DAG);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorDetails({ message: 'Pipeline name is required.' });
      return;
    }

    setIsSubmitting(true);
    setErrorDetails(null);

    try {
      let result;
      if (activeTab === 'template') {
        if (!selectedTemplateId) {
          throw new Error('Please select a template.');
        }
        result = await createPipelineFromTemplate(selectedTemplateId, name.trim());
      } else {
        // Custom DAG path
        let parsedDag;
        try {
          parsedDag = JSON.parse(dagJson);
        } catch (err: any) {
          throw new Error(`Invalid JSON syntax: ${err.message}`);
        }
        result = await createPipeline(name.trim(), parsedDag);
      }

      // Success
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      if (result && result.id) {
        setActivePipelineId(result.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Registration failed:', err);
      if (err.message) {
        setErrorDetails({ message: err.message });
      } else {
        setErrorDetails({ message: 'An unexpected error occurred.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Register New Pipeline</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'template' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('template');
              setErrorDetails(null);
            }}
          >
            Use a Template
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('custom');
              setErrorDetails(null);
            }}
          >
            Custom DAG (JSON)
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            {errorDetails && (
              <div className="error-banner">
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <span style={{ fontWeight: 600 }}>Error:</span> {errorDetails.message}
                  {errorDetails.details && errorDetails.details.length > 0 && (
                    <ul>
                      {errorDetails.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="pipeline-name">Pipeline Name</label>
              <input
                id="pipeline-name"
                type="text"
                className="form-input"
                placeholder="e.g. ecom-billing-service"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {activeTab === 'template' ? (
              <div className="form-group">
                <label className="form-label">Select Pipeline Template</label>
                {isLoadingTemplates ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 8 }}>Loading templates...</div>
                ) : (
                  <div className="template-card-grid">
                    {templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className={`template-card ${selectedTemplateId === tpl.id ? 'selected' : ''}`}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                      >
                        <div className="template-card-header">
                          <span className="template-card-title">{tpl.name}</span>
                          <span className="template-card-category">{tpl.category}</span>
                        </div>
                        <div className="template-card-desc">{tpl.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label className="form-label" htmlFor="dag-json">DAG Specification (JSON)</label>
                <textarea
                  id="dag-json"
                  className="form-textarea"
                  value={dagJson}
                  onChange={(e) => setDagJson(e.target.value)}
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
