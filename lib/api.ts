"use client";

import { toast } from "sonner";

export const api = {
  tasks: {
    async getAll() {
      try {
        const response = await fetch("/api/tasks", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error("API error:", error);
        toast.error("Failed to fetch tasks");
        throw error;
      }
    },

    async create(taskData: string) {
      try {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error("API error:", error);
        toast.error("Failed to create task");
        throw error;
      }
    },

    async update(id: number, updates: string) {
      try {
        const response = await fetch(`/api/tasks/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Task not found");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error("API error:", error);
        toast.error("Failed to update task");
        throw error;
      }
    },

    async delete(id: number) {
      try {
        const response = await fetch(`/api/tasks?id=${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Task not found");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error("API error:", error);
        toast.error("Failed to delete task");
        throw error;
      }
    },
  },
};