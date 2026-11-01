export interface MissionCleanupHealth {
  pendingCount: number;
  overdueCount: number;
  repeatedFailureCount: number;
  oldestPendingAt: string | null;
  checkedAt: string;
}
