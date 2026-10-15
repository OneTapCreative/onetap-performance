import type { Standing } from "./performance";
/** Architecture only: no secure coaching storage or authorization backend is implemented. */
export type CoachingRecord = {
  id: string;
  warehouseId: string;
  employeeId: string;
  managerId: string;
  meetingAt: string;
  conversationType: "performance" | "recognition" | "follow-up" | "other";
  managerNotes: string;
  employeeResponse: string;
  performanceSnapshot: {
    oneWeek: number | null;
    fourWeek: number | null;
    standard: number;
    standing: Standing;
    sourceRecordRevisions: { assignmentId: string; revision: number }[];
  };
  actionPlan: string;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};
export type CoachingAuditEvent = {
  id: string;
  coachingId: string;
  employeeId: string;
  actorManagerId: string;
  action: "created" | "amended" | "viewed";
  occurredAt: string;
  recordVersion: number;
};
export type CoachingAccess = {
  warehouseId: string;
  managerId: string;
  permittedEmployeeIds: string[];
  canRead: boolean;
  canWrite: boolean;
};
export const coachingModule = {
  state: "planned" as const,
  secureStorageImplemented: false,
  authorizationImplemented: false,
};
// No fabricated meetings are shown as completed or securely stored.
export const coachingRecords: CoachingRecord[] = [];
