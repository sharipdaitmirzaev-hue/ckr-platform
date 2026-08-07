/** Волны Public Launch (этап 41). */

export const LAUNCH_WAVE_STATUSES = [
  "planned",
  "active",
  "completed",
] as const;

export type LaunchWaveStatus = (typeof LAUNCH_WAVE_STATUSES)[number];

export const launchWaveStatusLabels: Record<LaunchWaveStatus, string> = {
  planned: "Запланирована",
  active: "Активна",
  completed: "Завершена",
};

export const LAUNCH_WAVE_TYPES = [
  "internal",
  "closed",
  "beta",
  "public",
] as const;

export type LaunchWaveType = (typeof LAUNCH_WAVE_TYPES)[number];

export const launchWaveTypeLabels: Record<LaunchWaveType, string> = {
  internal: "Internal",
  closed: "Closed",
  beta: "Beta",
  public: "Public",
};

export const LAUNCH_WAVE_PARTICIPANT_STATUSES = [
  "invited",
  "joined",
  "active",
  "completed",
  "left",
] as const;

export type LaunchWaveParticipantStatus =
  (typeof LAUNCH_WAVE_PARTICIPANT_STATUSES)[number];

export const launchWaveParticipantStatusLabels: Record<
  LaunchWaveParticipantStatus,
  string
> = {
  invited: "Приглашён",
  joined: "Присоединился",
  active: "Активен",
  completed: "Завершил",
  left: "Вышел",
};

/** Фиксированные UUID seed-волн (миграции 430000 / 450000). */
export const LAUNCH_WAVE_IDS = {
  internal: "c0000001-0000-4000-8000-000000000001",
  /** Closed Wave 1 — ТИНДА */
  closed: "c0000001-0000-4000-8000-000000000002",
  /** Launch Wave 3 — Public (бывшая public-волна) */
  public: "c0000001-0000-4000-8000-000000000003",
  /** Launch Wave 2 — экосистема beta */
  wave2: "c0000001-0000-4000-8000-000000000004",
  /** First Users Wave — ограниченный запуск (этап 50) */
  firstUsers: "c0000001-0000-4000-8000-000000000005",
  /** Beta Expansion Wave — расширенная закрытая beta (этап 53) */
  betaExpansion: "c0000001-0000-4000-8000-000000000006",
  /** Open Beta Wave 1 — контролируемый публичный запуск (этап 55) */
  openBeta: "c0000001-0000-4000-8000-000000000007",
  /** Public Launch Wave 1 — полноценный публичный запуск (этап 58) */
  publicLaunch: "c0000001-0000-4000-8000-000000000008",
} as const;

export const CLOSED_WAVE_TINDA_NAME = "Closed Wave 1 — ТИНДА" as const;
export const LAUNCH_WAVE_2_NAME = "Wave 2 — Ecosystem Beta" as const;
export const FIRST_USERS_WAVE_NAME = "First Users Wave" as const;
export const BETA_EXPANSION_WAVE_NAME = "Beta Expansion Wave" as const;
export const OPEN_BETA_WAVE_NAME = "Open Beta Wave 1" as const;
export const PUBLIC_LAUNCH_WAVE_NAME = "Public Launch Wave 1" as const;

export const TINDA_WAVE_PARTICIPANT_ID =
  "c0000002-0000-4000-8000-000000000001";

export function isLaunchWaveStatus(value: string): value is LaunchWaveStatus {
  return (LAUNCH_WAVE_STATUSES as readonly string[]).includes(value);
}

export function isLaunchWaveType(value: string): value is LaunchWaveType {
  return (LAUNCH_WAVE_TYPES as readonly string[]).includes(value);
}

export function isLaunchWaveParticipantStatus(
  value: string,
): value is LaunchWaveParticipantStatus {
  return (LAUNCH_WAVE_PARTICIPANT_STATUSES as readonly string[]).includes(
    value,
  );
}
