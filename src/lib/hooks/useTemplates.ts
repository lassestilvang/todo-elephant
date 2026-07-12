"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Task } from "@/types";
import {
  fetchTemplates,
  postTemplate,
  createTaskFromTemplate,
  deleteTemplateById,
  TemplateApiError,
  TemplateOverrides,
} from "../templatesApi";

/**
 * Template-aware task actions. Now a thin shell around `src/lib/templatesApi`
 * which holds the pure fetch logic — that module can be unit-tested without
 * a React renderer.
 */
export function useTaskTemplates() {
  const [templates, setTemplates] = useState<Task[]>([]);

  const loadTemplates = useCallback(async () => {
    const data = await fetchTemplates();
    setTemplates(data);
  }, []);

  /** Mark a task as a template (copies it, marks the copy, leaves original intact). */
  const saveAsTemplate = useCallback(
    async (task: Task, templateName?: string) => {
      try {
        const newTemplate = await postTemplate(task, templateName);
        setTemplates((prev) => [newTemplate, ...prev]);
        toast.success(`Saved as template: "${newTemplate.title}"`);
      } catch (err) {
        console.error(err);
        const msg = err instanceof TemplateApiError ? err.message : err instanceof Error ? err.message : "Failed to save task as template";
        toast.error(msg);
      }
    },
    [],
  );

  /** Spawn one or more tasks from a saved template. */
  const createFromTemplate = useCallback(
    async (templateId: number, overrides: TemplateOverrides = {}) => {
      try {
        const newTask = await createTaskFromTemplate(templateId, overrides, 1);
        if (newTask) toast.success(`Created task from template: "${newTask.title}"`);
        return newTask;
      } catch (err) {
        console.error(err);
        const msg = err instanceof TemplateApiError ? err.message : err instanceof Error ? err.message : "Failed to create task from template";
        toast.error(msg);
        return null;
      }
    },
    [],
  );

  /** Delete a template (removes the underlying task with isTemplate: true). */
  const deleteTemplate = useCallback(async (templateId: number) => {
    try {
      await deleteTemplateById(templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      toast.success("Template deleted");
    } catch (err) {
      console.error(err);
      const msg = err instanceof TemplateApiError ? err.message : err instanceof Error ? err.message : "Failed to delete template";
      toast.error(msg);
    }
  }, []);

  return { templates, loadTemplates, saveAsTemplate, createFromTemplate, deleteTemplate };
}
