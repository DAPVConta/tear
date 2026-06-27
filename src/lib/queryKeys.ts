// Fábrica tipada de query keys por domínio.
// Centraliza strings para evitar typos silenciosos e renomear com segurança.
// Cada hook usa keys.<domain>.list(...) etc.; invalidações usam o mesmo objeto.

export const keys = {
  patients: {
    all: ["patients"] as const,
    list: (
      clinicId: number | undefined,
      search: string,
      page: number,
      sortBy: string,
      sortDir: string,
      reportStatus: string,
    ) =>
      ["patients", clinicId, search, page, sortBy, sortDir, reportStatus] as const,
    byId: (id: number | undefined) => ["patient", id] as const,
    options: (clinicId: number | undefined) => ["patient-options", clinicId] as const,
  },
  professionals: {
    all: ["professionals"] as const,
    list: (clinicId: number | undefined, search: string, page: number, sortBy: string, sortDir: string, status: string) =>
      ["professionals", clinicId, search, page, sortBy, sortDir, status] as const,
    byId: (id: number | undefined) => ["professional", id] as const,
    options: (clinicId: number | undefined) => ["professional-options", clinicId] as const,
  },
  authorizations: {
    all: ["authorizations"] as const,
    list: (clinicId: number | undefined, search: string, page: number) =>
      ["authorizations", clinicId, search, page] as const,
    byId: (id: number | undefined) => ["authorization", id] as const,
    activeByPatient: (clinicId: number | undefined, patientId: number | undefined) =>
      ["active-authorizations", clinicId, patientId] as const,
  },
  plans: {
    all: ["plans"] as const,
    list: (clinicId: number | undefined, search: string, page: number) =>
      ["plans", clinicId, search, page] as const,
    byId: (id: number | undefined) => ["plan", id] as const,
    byPatient: (clinicId: number | undefined, patientId: number | undefined) =>
      ["plans-with-goals", clinicId, patientId] as const,
  },
  evolutions: {
    all: ["daily-evolutions"] as const,
    list: (
      clinicId: number | undefined,
      page: number,
      patientId: number | undefined,
      specialty: string | undefined,
      from: string | undefined,
      to: string | undefined,
    ) =>
      ["daily-evolutions", clinicId, page, patientId, specialty, from, to] as const,
    byId: (id: number | undefined) => ["daily-evolution", id] as const,
  },
  attendances: {
    all: ["attendances"] as const,
    list: (
      clinicId: number | undefined,
      page: number,
      patientId: number | undefined,
      from: string | undefined,
      to: string | undefined,
    ) => ["attendances", clinicId, page, patientId, from, to] as const,
    byId: (id: number | undefined) => ["attendance", id] as const,
  },
  monthly: {
    all: ["monthly-evolutions"] as const,
    list: (
      clinicId: number | undefined,
      page: number,
      patientId: number | undefined,
      year: number | undefined,
    ) => ["monthly-evolutions", clinicId, page, patientId, year] as const,
    byId: (id: number | undefined) => ["monthly-evolution", id] as const,
  },
  audit: {
    checklist: (clinicId: number | undefined, from: string, to: string, patientId: number | undefined) =>
      ["billing-checklist", clinicId, from, to, patientId] as const,
    logs: (clinicId: number | undefined, from: string, to: string, limit: number) =>
      ["audit-logs", clinicId, from, to, limit] as const,
  },
  dashboard: {
    metrics: (clinicId: number | undefined) => ["dashboard-metrics", clinicId] as const,
    sessionsByDay: (clinicId: number | undefined, days: number) =>
      ["dashboard-sessions-by-day", clinicId, days] as const,
    expiringGuides: (clinicId: number | undefined, withinDays: number) =>
      ["dashboard-expiring-guides", clinicId, withinDays] as const,
    assessmentDistribution: (clinicId: number | undefined, days: number) =>
      ["dashboard-assessments", clinicId, days] as const,
  },
  platform: {
    overview: ["platform-overview"] as const,
  },
  corrections: {
    all: ["corrections"] as const,
    list: (clinicId: number | undefined) => ["corrections", clinicId] as const,
    signedUrls: (paths: string[]) =>
      ["correction-signed-urls", ...paths] as const,
  },
  currentClinic: Object.assign(
    (userId: string | undefined) => ["current-clinic", userId] as const,
    { all: ["current-clinic"] as const },
  ),
  lgpd: {
    myDeletionRequest: (userId: string | undefined) => ["my-deletion-request", userId] as const,
  },
} as const;
