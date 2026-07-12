import { describe, it, expect } from "vitest";
import {
  TASK_STATUS,
  normalizeStatus,
  isCompletedStatus,
  isActiveStatus,
  isArchivedStatus,
  getKanbanColumnId,
} from "@/src/lib/status";

describe("status normalization", () => {
  it("maps legacy values to canonical", () => {
    expect(normalizeStatus("pending")).toBe(TASK_STATUS.TODO);
    expect(normalizeStatus("todo")).toBe(TASK_STATUS.TODO);
    expect(normalizeStatus("in_progress")).toBe(TASK_STATUS.IN_PROGRESS);
    expect(normalizeStatus("in-progress")).toBe(TASK_STATUS.IN_PROGRESS);
    expect(normalizeStatus("completed")).toBe(TASK_STATUS.COMPLETED);
    expect(normalizeStatus("done")).toBe(TASK_STATUS.COMPLETED);
    expect(normalizeStatus("archived")).toBe(TASK_STATUS.ARCHIVED);
  });

  it("returns TODO for unknown / empty values", () => {
    expect(normalizeStatus(undefined)).toBe(TASK_STATUS.TODO);
    expect(normalizeStatus(null)).toBe(TASK_STATUS.TODO);
    expect(normalizeStatus("weird-thing")).toBe(TASK_STATUS.TODO);
  });

  it("is case-insensitive", () => {
    expect(normalizeStatus("DONE")).toBe(TASK_STATUS.COMPLETED);
    expect(normalizeStatus("ArChiVeD")).toBe(TASK_STATUS.ARCHIVED);
  });

  it("predicate helpers accept legacy and canonical forms", () => {
    expect(isCompletedStatus("done")).toBe(true);
    expect(isCompletedStatus("completed")).toBe(true);
    expect(isCompletedStatus("pending")).toBe(false);
    expect(isActiveStatus("in_progress")).toBe(true);
    expect(isActiveStatus("pending")).toBe(true);
    expect(isActiveStatus("archived")).toBe(false);
    expect(isArchivedStatus("archived")).toBe(true);
    expect(isArchivedStatus("done")).toBe(false);
  });

  it("getKanbanColumnId falls back to TODO", () => {
    expect(getKanbanColumnId(undefined)).toBe(TASK_STATUS.TODO);
    expect(getKanbanColumnId("in_progress")).toBe(TASK_STATUS.IN_PROGRESS);
    expect(getKanbanColumnId("completed")).toBe(TASK_STATUS.COMPLETED);
  });
});
