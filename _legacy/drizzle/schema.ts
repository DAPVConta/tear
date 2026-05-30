import {
  boolean,
  date,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  time,
  timestamp,
  varchar,
  bigint,
} from "drizzle-orm/mysql-core";

// ==================== USERS (Auth) ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "platform_admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== CLÍNICAS (Tenants) ====================
export const clinics = mysqlTable("clinics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }).notNull().unique(),
  tradeName: varchar("tradeName", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  plan: mysqlEnum("plan", ["trial", "basic", "professional", "enterprise"]).default("trial").notNull(),
  planStatus: mysqlEnum("planStatus", ["active", "past_due", "canceled", "trialing"]).default("trialing").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
  maxProfessionals: int("maxProfessionals").default(5).notNull(),
  maxPatients: int("maxPatients").default(50).notNull(),
  logoUrl: varchar("logoUrl", { length: 500 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = typeof clinics.$inferInsert;

// ==================== MEMBROS DA CLÍNICA ====================
export const clinicMembers = mysqlTable("clinic_members", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").references(() => clinics.id).notNull(),
  userId: int("userId").references(() => users.id).notNull(),
  role: mysqlEnum("member_role", ["clinic_admin", "therapist", "receptionist"]).notNull(),
  active: boolean("active").default(true).notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  joinedAt: timestamp("joinedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClinicMember = typeof clinicMembers.$inferSelect;
export type InsertClinicMember = typeof clinicMembers.$inferInsert;

// ==================== PROFISSIONAIS/TERAPEUTAS ====================
export const professionals = mysqlTable("professionals", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").references(() => clinics.id).notNull(),
  userId: int("userId").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull(),
  specialty: mysqlEnum("specialty", [
    "psicologia_aba",
    "fonoaudiologia",
    "terapia_ocupacional_is",
    "terapia_ocupacional_avds",
    "fisioterapia",
    "psicopedagogia",
    "musicoterapia",
    "neuropsicologia",
  ]).notNull(),
  councilType: varchar("councilType", { length: 20 }).notNull(),
  councilNumber: varchar("councilNumber", { length: 30 }).notNull(),
  councilState: varchar("councilState", { length: 2 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  active: boolean("active").default(true).notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Professional = typeof professionals.$inferSelect;
export type InsertProfessional = typeof professionals.$inferInsert;

// ==================== PACIENTES ====================
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").references(() => clinics.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }),
  birthDate: date("birthDate").notNull(),
  gender: mysqlEnum("gender", ["masculino", "feminino", "outro"]).notNull(),
  guardianName: varchar("guardianName", { length: 255 }).notNull(),
  guardianCpf: varchar("guardianCpf", { length: 14 }).notNull(),
  guardianPhone: varchar("guardianPhone", { length: 20 }).notNull(),
  guardianEmail: varchar("guardianEmail", { length: 320 }),
  // Tipo de pagamento: operadora ou particular
  paymentType: mysqlEnum("paymentType", ["operadora", "particular"]).default("operadora").notNull(),
  healthPlanName: varchar("healthPlanName", { length: 255 }),
  healthPlanCard: varchar("healthPlanCard", { length: 50 }),
  cid10Primary: varchar("cid10Primary", { length: 10 }).notNull(),
  cid10Secondary: varchar("cid10Secondary", { length: 10 }),
  diagnosis: text("diagnosis"),
  address: text("address"),
  active: boolean("active").default(true).notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

// ==================== GUIAS/AUTORIZAÇÕES ====================
export const authorizations = mysqlTable("authorizations", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").references(() => clinics.id).notNull(),
  patientId: int("patientId").references(() => patients.id).notNull(),
  guideNumber: varchar("guideNumber", { length: 50 }).notNull(),
  authorizationDate: date("authorizationDate").notNull(),
  expirationDate: date("expirationDate").notNull(),
  procedureCode: varchar("procedureCode", { length: 20 }).notNull(),
  procedureName: varchar("procedureName", { length: 255 }).notNull(),
  authorizedQuantity: int("authorizedQuantity").notNull(),
  usedQuantity: int("usedQuantity").default(0).notNull(),
  specialty: mysqlEnum("specialty_auth", [
    "psicologia_aba",
    "fonoaudiologia",
    "terapia_ocupacional_is",
    "terapia_ocupacional_avds",
    "fisioterapia",
    "psicopedagogia",
    "musicoterapia",
    "neuropsicologia",
  ]).notNull(),
  status: mysqlEnum("status_auth", ["ativa", "vencida", "cancelada", "esgotada"])
    .default("ativa")
    .notNull(),
  observations: text("observations"),
  createdByUserId: int("createdByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Authorization = typeof authorizations.$inferSelect;
export type InsertAuthorization = typeof authorizations.$inferInsert;

// ==================== PLANO TERAPÊUTICO SINGULAR (PTS) ====================
export const therapeuticPlans = mysqlTable("therapeutic_plans", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").references(() => clinics.id).notNull(),
  patientId: int("patientId").references(() => patients.id).notNull(),
  professionalId: int("professionalId").references(() => professionals.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  frequency: varchar("frequency", { length: 100 }).notNull(),
  sessionDuration: int("sessionDuration").notNull(),
  generalObjective: text("generalObjective").notNull(),
  status: mysqlEnum("status_pts", ["ativo", "revisao", "encerrado"])
    .default("ativo")
    .notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TherapeuticPlan = typeof therapeuticPlans.$inferSelect;
export type InsertTherapeuticPlan = typeof therapeuticPlans.$inferInsert;

// ==================== METAS DO PTS ====================
export const therapeuticGoals = mysqlTable("therapeutic_goals", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").references(() => therapeuticPlans.id).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  targetCriteria: text("targetCriteria").notNull(),
  currentProgress: decimal("currentProgress", { precision: 5, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status_goal", ["em_andamento", "adquirida", "em_manutencao", "descontinuada"])
    .default("em_andamento")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TherapeuticGoal = typeof therapeuticGoals.$inferSelect;
export type InsertTherapeuticGoal = typeof therapeuticGoals.$inferInsert;

// ==================== EVOLUÇÃO DIÁRIA ====================
export const dailyEvolutions = mysqlTable("daily_evolutions", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").references(() => clinics.id).notNull(),
  patientId: int("patientId").references(() => patients.id).notNull(),
  professionalId: int("professionalId").references(() => professionals.id).notNull(),
  authorizationId: int("authorizationId").references(() => authorizations.id), // NULLABLE para particular
  planId: int("planId").references(() => therapeuticPlans.id),
  isPrivate: boolean("isPrivate").default(false).notNull(), // Sessão particular
  sessionDate: date("sessionDate").notNull(),
  startTime: time("startTime").notNull(),
  endTime: time("endTime").notNull(),
  sessionDurationMinutes: int("sessionDurationMinutes").notNull(),
  attendanceType: mysqlEnum("attendanceType", [
    "individual_presencial",
    "individual_domiciliar",
    "individual_escolar",
    "grupo_presencial",
  ]).notNull(),
  goalsWorked: json("goalsWorked").notNull(),
  skillsWorked: json("skillsWorked").notNull(),
  promptingLevel: mysqlEnum("promptingLevel", [
    "fisica_total",
    "fisica_parcial",
    "gestual",
    "verbal",
    "independente",
  ]).notNull(),
  behavioralNotes: text("behavioralNotes"),
  behavioralIntervention: text("behavioralIntervention"),
  sessionSummary: text("sessionSummary").notNull(),
  evolutionAssessment: mysqlEnum("evolutionAssessment", [
    "evolucao_significativa",
    "evolucao_leve",
    "estavel",
    "retrocesso_leve",
    "retrocesso_significativo",
  ]).notNull(),
  nextSessionPlan: text("nextSessionPlan").notNull(),
  incidents: text("incidents"),
  professionalSignature: boolean("professionalSignature").default(false).notNull(),
  signedAt: timestamp("signedAt"),
  guardianPresenceValidation: boolean("guardianPresenceValidation").default(false).notNull(),
  guardianValidationMethod: mysqlEnum("guardianValidationMethod", [
    "assinatura_digital",
    "token",
    "presencial",
  ]),
  locked: boolean("locked").default(false).notNull(),
  lockedAt: timestamp("lockedAt"),
  addendum: json("addendum"),
  createdByUserId: int("createdByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyEvolution = typeof dailyEvolutions.$inferSelect;
export type InsertDailyEvolution = typeof dailyEvolutions.$inferInsert;

// ==================== EVOLUÇÃO MENSAL ====================
export const monthlyEvolutions = mysqlTable("monthly_evolutions", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").references(() => clinics.id).notNull(),
  patientId: int("patientId").references(() => patients.id).notNull(),
  professionalId: int("professionalId").references(() => professionals.id).notNull(),
  referenceMonth: int("referenceMonth").notNull(),
  referenceYear: int("referenceYear").notNull(),
  totalSessions: int("totalSessions").notNull(),
  totalPresent: int("totalPresent").notNull(),
  totalAbsent: int("totalAbsent").notNull(),
  goalsProgress: json("goalsProgress").notNull(),
  generatedSummary: text("generatedSummary").notNull(),
  professionalReview: text("professionalReview"),
  approved: boolean("approved").default(false).notNull(),
  approvedAt: timestamp("approvedAt"),
  conclusion: text("conclusion"),
  nextMonthPlan: text("nextMonthPlan"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonthlyEvolution = typeof monthlyEvolutions.$inferSelect;
export type InsertMonthlyEvolution = typeof monthlyEvolutions.$inferInsert;

// ==================== REGISTRO DE PRESENÇA/FREQUÊNCIA ====================
export const attendanceRecords = mysqlTable("attendance_records", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").references(() => clinics.id).notNull(),
  patientId: int("patientId").references(() => patients.id).notNull(),
  professionalId: int("professionalId").references(() => professionals.id).notNull(),
  authorizationId: int("authorizationId").references(() => authorizations.id), // NULLABLE para particular
  sessionDate: date("sessionDate").notNull(),
  status: mysqlEnum("status_attendance", [
    "presente",
    "falta_justificada",
    "falta_injustificada",
    "cancelado_clinica",
    "cancelado_paciente",
  ]).notNull(),
  justification: text("justification"),
  evolutionId: int("evolutionId").references(() => dailyEvolutions.id),
  guardianSignature: boolean("guardianSignature").default(false).notNull(),
  isPrivate: boolean("isPrivateAttendance").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = typeof attendanceRecords.$inferInsert;

// ==================== AUDIT LOG ====================
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").references(() => clinics.id),
  userId: int("userId").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  tableName: varchar("tableName", { length: 100 }).notNull(),
  recordId: int("recordId"),
  oldValues: json("oldValues"),
  newValues: json("newValues"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
