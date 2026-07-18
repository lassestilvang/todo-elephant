"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, ChevronDown, Star, Zap, Clock, Trash2, Edit, Share2, Copy, Download, ExternalLink, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { TaskTemplate } from "@/lib/templates/smart-templates";
import { useToast } from "@/hooks/useToast";

interface TemplateWizardProps {
  onClose: () => void;
  onTemplateCreated: (template: TaskTemplate) => void;
  initialDescription?: string;
}

export default function TemplateWizard({ onClose, onTemplateCreated, initialDescription }: TemplateWizardProps) {
  const [step, setStep] = useState<'describe' | 'review' | 'customize' | 'save'>('describe');
  const [description, setDescription] = useState(initialDescription || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<TaskTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [isPublic, setIsPublic] = useState(false);
  const [customName, setCustomName] = useState('');
  const toast = useToast();

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskDescription: description })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedTemplate(data.template);
        setCustomName(data.template.name);
        setSelectedCategory(data.template.category);
        setStep('review');
      } else {
        toast.error(data.error || 'Failed to generate template');
      }
    } catch (error) {
      toast.error('Failed to generate template');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedTemplate) return;

    const updatedTemplate = {
      ...generatedTemplate,
      name: customName,
      category: selectedCategory,
      isPublic,
      authorId: undefined // Will be set by API
    };

    try {
      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: updatedTemplate.id, updates: updatedTemplate })
      });

      const data = await response.json();
      if (data.success) {
        onTemplateCreated(data.template);
        toast.success('Template saved successfully!');
        onClose();
      } else {
        toast.error(data.error || 'Failed to save template');
      }
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const categories = [
    'general', 'work', 'personal', 'learning', 'health', 'finance',
    'creative', 'admin', 'planning', 'project', 'habit', 'maintenance'
  ];

  if (step === 'describe') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-card rounded-3xl border border-border w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-bold">Create Smart Template</h2>
            <p className="text-sm text-muted mt-1">Describe your project or workflow, and AI will generate an optimal task template</p>
          </div>

          <div className="p-6 flex-1 overflow-auto">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 'Launch a new product website with landing page, blog, and analytics'"
              className="w-full h-32 p-4 rounded-xl border border-border bg-background text-foreground resize-none focus:ring-2 focus:ring-accent"
              rows={4}
            />

            <div className="mt-4 p-4 rounded-xl border border-border bg-muted/30">
              <p className="text-sm text-muted mb-2">Examples:</p>
              <ul className="space-y-1 text-sm text-muted">
                <li>• "Weekly team sprint planning with retrospective"</li>
                <li>• "Deep work session for writing a research paper"</li>
                <li>• "Morning routine: exercise, meditation, planning"</li>
                <li>• "Code review workflow for pull requests"</li>
              </ul>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!description.trim() || isGenerating}
              className="mt-6 w-full py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Generate Template
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-4 text-center text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === 'review' && generatedTemplate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-card rounded-3xl border border-border w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Review & Customize</h2>
              <p className="text-sm text-muted mt-1">Review the generated template and make adjustments</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('describe')} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-border/50">Back</button>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Template name"
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-accent"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-accent"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-border/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 accent-accent"
                />
                <span className="text-sm">Make public for community sharing</span>
              </label>

              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <h4 className="font-bold mb-3">Generated Tasks ({generatedTemplate.tasks.length})</h4>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {generatedTemplate.tasks.map((task, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/50">
                      <span className="text-lg font-bold text-muted w-8">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            task.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                            task.priority === 'medium' ? 'bg-amber-500/20 text-amber-500' :
                            'bg-blue-500/20 text-blue-500'
                          }`}>
                            {task.priority}
                          </span>
                          <span>{task.estimatedMinutes} min</span>
                          <span>{task.category}</span>
                          {task.dependsOn && <span>→ {task.dependsOn}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{generatedTemplate.estimatedTotalMinutes} min</p>
                  <p className="text-xs text-muted">Total Est. Time</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-2xl font-bold capitalize">{generatedTemplate.difficulty}</p>
                  <p className="text-xs text-muted">Difficulty</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-2xl font-bold">{generatedTemplate.tasks.length}</p>
                  <p className="text-xs text-muted">Tasks</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border flex gap-3 justify-end">
            <button onClick={() => setStep('describe')} className="px-6 py-3 rounded-xl border border-border text-sm font-medium hover:bg-border/50">
              Back
            </button>
            <button onClick={handleSave} className="px-6 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90">
              Save Template
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

interface TemplateSelectorProps {
  onSelect: (template: TaskTemplate) => void;
  onClose: () => void;
  category?: string;
}

export function TemplateSelector({ onSelect, onClose, category }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || '');
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadTemplates();
  }, [searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      params.set('limit', '50');

      const response = await fetch(`/api/templates?${params.toString()}`);
      const data = await response.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTemplate = (template: TaskTemplate) => {
    onSelect(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-3xl border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Choose Template</h2>
            <p className="text-sm text-muted mt-1">Select a template to apply to your current project</p>
          </div>
        </div>

        <div className="p-6 border-b border-border flex flex-col gap-4">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-accent appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-accent" size={32} />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16">
              <Zap size={64} className="text-muted/30 mx-auto mb-4" />
              <p className="text-muted">No templates found. Create your first smart template!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleUseTemplate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, onSelect }: { template: TaskTemplate; onSelect: (t: TaskTemplate) => void }) {
  return (
    <div className="p-4 rounded-2xl border border-border bg-card/40 hover:border-accent/50 transition-all cursor-pointer"
         onClick={() => onSelect(template)}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-lg truncate">{template.name}</h3>
        {template.isPublic && (
          <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-500">Public</span>
        )}
      </div>
      <p className="text-sm text-muted mb-3 line-clamp-2">{template.description}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {template.tags.slice(0, 4).map(tag => (
          <span key={tag} className="px-2 py-0.5 rounded text-xs bg-muted/50 text-muted">{tag}</span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1"><Zap size={12} /> {template.estimatedTotalMinutes} min</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {template.tasks.length} tasks</span>
          <span className="flex items-center gap-1 capitalize">{template.difficulty}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(template);
          }}
          className="px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20"
        >
          Use Template
        </button>
      </div>
    </div>
  );
}

interface TemplateAnalyticsProps {
  templateId: string;
}

export function TemplateAnalytics({ templateId }: TemplateAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [templateId]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/templates/analytics?templateId=${templateId}`);
      const data = await response.json();
      if (data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-accent" size={32} /></div>;
  }

  if (!analytics) {
    return <div className="text-center py-8 text-muted">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold">Template Analytics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Uses" value={analytics.totalUses} icon={Zap} color="text-accent" />
        <StatCard label="Completions" value={analytics.completions} icon={CheckCircle2} color="text-emerald-500" />
        <StatCard label="Success Rate" value={`${analytics.successRate.toFixed(1)}%`} icon={Star} color="text-amber-500" />
        <StatCard label="Avg Time" value={`${Math.round(analytics.averageCompletionTime)} min`} icon={Clock} color="text-blue-500" />
      </div>

      {analytics.commonDropOffPoints?.length > 0 && (
        <div className="p-4 rounded-xl border border-border bg-card/40">
          <h4 className="font-bold mb-3">Common Drop-off Points</h4>
          <div className="space-y-2">
            {analytics.commonDropOffPoints.map((point: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">{point.taskTitle}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${point.dropOffRate}%` }} />
                  </div>
                  <span className="text-xs text-red-500 font-medium">{point.dropOffRate.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="p-4 rounded-2xl border border-border bg-card/40">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className={color} />
        <span className="text-xs text-muted">{label}</span>
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}