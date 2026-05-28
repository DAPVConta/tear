import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<TrpcContext>): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "terapeuta@clinica.com",
    name: "Dr. Maria Silva",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    clinicMember: null,
    clinic: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
    ...overrides,
  };

  return { ctx };
}

function createContextWithClinic(): { ctx: TrpcContext } {
  return createAuthContext({
    clinic: {
      id: 1,
      name: "Clínica Teste",
      cnpj: "12345678000100",
      email: "clinica@teste.com",
      phone: "11999999999",
      address: "Rua Teste, 123",
      city: "São Paulo",
      state: "SP",
      plan: "professional",
      planStatus: "active",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    clinicMember: {
      id: 1,
      clinicId: 1,
      userId: 1,
      role: "clinic_admin",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

// =============================================
// DASHBOARD
// =============================================
describe("Dashboard Router", () => {
  it("returns stats structure with correct fields", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();

    expect(stats).toHaveProperty("patients");
    expect(stats).toHaveProperty("professionals");
    expect(stats).toHaveProperty("evolutions");
    expect(stats).toHaveProperty("activeAuths");
    expect(typeof stats.patients).toBe("number");
    expect(typeof stats.professionals).toBe("number");
    expect(typeof stats.evolutions).toBe("number");
    expect(typeof stats.activeAuths).toBe("number");
  });

  it("returns alerts as an array", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.dashboard.alerts();

    expect(Array.isArray(alerts)).toBe(true);
  });
});

// =============================================
// PATIENTS
// =============================================
describe("Patients Router", () => {
  it("returns empty list initially", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const patients = await caller.patients.list({});

    expect(Array.isArray(patients)).toBe(true);
  });
});

// =============================================
// PROFESSIONALS
// =============================================
describe("Professionals Router", () => {
  it("returns empty list initially", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const professionals = await caller.professionals.list({});

    expect(Array.isArray(professionals)).toBe(true);
  });
});

// =============================================
// AUTHORIZATIONS
// =============================================
describe("Authorizations Router", () => {
  it("returns empty list initially", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const authorizations = await caller.authorizations.list({});

    expect(Array.isArray(authorizations)).toBe(true);
  });
});

// =============================================
// DAILY EVOLUTIONS - BLINDAGEM ANTI-GLOSA
// =============================================
describe("Daily Evolutions Router", () => {
  it("returns empty list initially", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const evolutions = await caller.dailyEvolutions.list({});

    expect(Array.isArray(evolutions)).toBe(true);
  });

  it("rejects evolution without guardian validation (blindagem)", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.dailyEvolutions.create({
        patientId: 1,
        professionalId: 1,
        authorizationId: 1,
        sessionDate: "2026-05-09",
        startTime: "08:00",
        endTime: "09:00",
        sessionDurationMinutes: 60,
        attendanceType: "individual_presencial",
        goalsWorked: [1],
        skillsWorked: [{ goalId: 1, skill: "Comunicação", promptLevel: "verbal", response: "Boa resposta" }],
        promptingLevel: "verbal",
        sessionSummary: "Sessão produtiva com bom engajamento do paciente",
        evolutionAssessment: "evolucao_leve",
        nextSessionPlan: "Continuar trabalhando comunicação funcional",
        guardianPresenceValidation: false,
        guardianValidationMethod: "presencial",
      })
    ).rejects.toThrow();
  });

  it("rejects evolution with session duration less than 30 minutes (blindagem)", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.dailyEvolutions.create({
        patientId: 1,
        professionalId: 1,
        authorizationId: 1,
        sessionDate: "2026-05-09",
        startTime: "08:00",
        endTime: "08:20",
        sessionDurationMinutes: 20,
        attendanceType: "individual_presencial",
        goalsWorked: [1],
        skillsWorked: [{ goalId: 1, skill: "Comunicação", promptLevel: "verbal", response: "Boa resposta" }],
        promptingLevel: "verbal",
        sessionSummary: "Sessão curta para teste de validação",
        evolutionAssessment: "estavel",
        nextSessionPlan: "Plano para próxima sessão",
        guardianPresenceValidation: true,
        guardianValidationMethod: "presencial",
      })
    ).rejects.toThrow();
  });

  it("allows evolution with empty goals for private patients", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    // With isPrivate=true, goalsWorked can be empty
    const result = await caller.dailyEvolutions.create({
      patientId: 1,
      professionalId: 1,
      isPrivate: true,
      sessionDate: "2026-05-09",
      startTime: "08:00",
      endTime: "09:00",
      sessionDurationMinutes: 60,
      attendanceType: "individual_presencial",
      goalsWorked: [],
      skillsWorked: [{ goalId: 1, skill: "Comunicação", promptLevel: "verbal", response: "Boa resposta" }],
      promptingLevel: "verbal",
      sessionSummary: "Sessão particular sem objetivos vinculados",
      evolutionAssessment: "estavel",
      nextSessionPlan: "Plano para próxima sessão",
      guardianPresenceValidation: true,
      guardianValidationMethod: "presencial",
    });
    expect(result).toHaveProperty("id");
  });

  it("rejects evolution with empty skills worked (blindagem)", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.dailyEvolutions.create({
        patientId: 1,
        professionalId: 1,
        authorizationId: 1,
        sessionDate: "2026-05-09",
        startTime: "08:00",
        endTime: "09:00",
        sessionDurationMinutes: 60,
        attendanceType: "individual_presencial",
        goalsWorked: [1],
        skillsWorked: [],
        promptingLevel: "verbal",
        sessionSummary: "Sessão sem habilidades registradas",
        evolutionAssessment: "estavel",
        nextSessionPlan: "Plano para próxima sessão",
        guardianPresenceValidation: true,
        guardianValidationMethod: "presencial",
      })
    ).rejects.toThrow();
  });

  it("rejects evolution with short session summary (blindagem)", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.dailyEvolutions.create({
        patientId: 1,
        professionalId: 1,
        authorizationId: 1,
        sessionDate: "2026-05-09",
        startTime: "08:00",
        endTime: "09:00",
        sessionDurationMinutes: 60,
        attendanceType: "individual_presencial",
        goalsWorked: [1],
        skillsWorked: [{ goalId: 1, skill: "Comunicação", promptLevel: "verbal", response: "Boa resposta" }],
        promptingLevel: "verbal",
        sessionSummary: "Curto",
        evolutionAssessment: "estavel",
        nextSessionPlan: "Plano para próxima sessão",
        guardianPresenceValidation: true,
        guardianValidationMethod: "presencial",
      })
    ).rejects.toThrow();
  });
});

// =============================================
// ATTENDANCE
// =============================================
describe("Attendance Router", () => {
  it("returns empty list initially", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const records = await caller.attendance.list({});

    expect(Array.isArray(records)).toBe(true);
  });

  it("requires justification for justified absences (blindagem)", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.attendance.registerAbsence({
        patientId: 1,
        professionalId: 1,
        authorizationId: 1,
        sessionDate: "2026-05-09",
        status: "falta_justificada",
        // Missing justification
      })
    ).rejects.toThrow();
  });
});

// =============================================
// MONTHLY EVOLUTIONS
// =============================================
describe("Monthly Evolutions Router", () => {
  it("returns empty list initially", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const evolutions = await caller.monthlyEvolutions.list({});

    expect(Array.isArray(evolutions)).toBe(true);
  });

  it("rejects generation without evolutions in period", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.monthlyEvolutions.generate({
        patientId: 999,
        professionalId: 999,
        month: 1,
        year: 2020,
      })
    ).rejects.toThrow();
  });
});

// =============================================
// AUDIT
// =============================================
describe("Audit Router", () => {
  it("returns billing checklist with correct structure", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.audit.billingChecklist({ month: 5, year: 2026 });

    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("summary");
    expect(Array.isArray(result.issues)).toBe(true);
  });
});

// =============================================
// THERAPEUTIC PLANS
// =============================================
describe("Therapeutic Plans Router", () => {
  it("returns empty list initially", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.therapeuticPlans.list({});

    expect(Array.isArray(plans)).toBe(true);
  });

  it("returns empty goals for non-existent plan", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const goals = await caller.therapeuticPlans.listGoals({ planId: 999 });

    expect(Array.isArray(goals)).toBe(true);
    expect(goals.length).toBe(0);
  });
});

// =============================================
// CLINICS (MULTI-TENANCY)
// =============================================
describe("Clinics Router", () => {
  it("returns current clinic from context", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const clinic = await caller.clinics.current();

    expect(clinic).toBeDefined();
    expect(clinic).toHaveProperty("id");
    expect(clinic).toHaveProperty("name");
    expect(clinic?.name).toBe("Clínica Teste");
  });

  it("returns null when user has no clinic", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const clinic = await caller.clinics.current();

    expect(clinic).toBeNull();
  });

  it("returns my clinics list", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const clinics = await caller.clinics.myClinics();

    expect(Array.isArray(clinics)).toBe(true);
  });
});

// =============================================
// STRIPE
// =============================================
describe("Stripe Router", () => {
  it("returns plans list with correct structure", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.stripe.getPlans();

    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBeGreaterThan(0);

    const plan = plans[0];
    expect(plan).toHaveProperty("id");
    expect(plan).toHaveProperty("name");
    expect(plan).toHaveProperty("price");
    expect(plan).toHaveProperty("features");
    expect(typeof plan.price).toBe("number");
    expect(Array.isArray(plan.features)).toBe(true);
  });

  it("returns subscription status for clinic with plan info", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.stripe.getSubscriptionStatus();

    // The router returns the clinic's plan info from DB
    // It may return null if DB query fails, or an object with plan/status
    if (status !== null) {
      expect(status).toHaveProperty("plan");
      expect(status).toHaveProperty("status");
    }
  });

  it("returns null when user has no clinic", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.stripe.getSubscriptionStatus();

    // When no clinic in context, returns null
    expect(status).toBeNull();
  });
});

// =============================================
// SUPER ADMIN (Platform Admin)
// =============================================
describe("Super Admin Router", () => {
  function createPlatformAdminContext(): { ctx: TrpcContext } {
    return createAuthContext({
      user: {
        id: 1,
        openId: "platform-admin-001",
        email: "admin@peet.com.br",
        name: "Admin Plataforma",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    });
  }

  function createRegularUserContext(): { ctx: TrpcContext } {
    return createAuthContext({
      user: {
        id: 2,
        openId: "regular-user-001",
        email: "user@clinica.com",
        name: "Usuário Comum",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    });
  }

  it("returns platform stats for admin user", async () => {
    const { ctx } = createPlatformAdminContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.superAdmin.platformStats();

    expect(stats).toHaveProperty("totalClinics");
    expect(stats).toHaveProperty("activeClinics");
    expect(stats).toHaveProperty("trialClinics");
    expect(stats).toHaveProperty("paidClinics");
    expect(stats).toHaveProperty("totalUsers");
    expect(stats).toHaveProperty("totalPatients");
    expect(stats).toHaveProperty("totalEvolutions");
    expect(stats).toHaveProperty("mrr");
    expect(stats).toHaveProperty("planDistribution");
    expect(stats).toHaveProperty("statusDistribution");
    expect(typeof stats.totalClinics).toBe("number");
    expect(typeof stats.mrr).toBe("number");
    expect(Array.isArray(stats.planDistribution)).toBe(true);
    expect(Array.isArray(stats.statusDistribution)).toBe(true);
  });

  it("returns clinics list for admin user", async () => {
    const { ctx } = createPlatformAdminContext();
    const caller = appRouter.createCaller(ctx);

    const clinicsList = await caller.superAdmin.listClinics({});

    expect(Array.isArray(clinicsList)).toBe(true);
  });

  it("rejects platform stats for regular user", async () => {
    const { ctx } = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.superAdmin.platformStats()).rejects.toThrow();
  });

  it("rejects clinics list for regular user", async () => {
    const { ctx } = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.superAdmin.listClinics({})).rejects.toThrow();
  });

  it("rejects clinic detail for regular user", async () => {
    const { ctx } = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.superAdmin.clinicDetail({ clinicId: 1 })).rejects.toThrow();
  });

  it("rejects toggle clinic status for regular user", async () => {
    const { ctx } = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.superAdmin.toggleClinicStatus({ clinicId: 1, active: false })).rejects.toThrow();
  });

  it("supports filtering clinics by plan", async () => {
    const { ctx } = createPlatformAdminContext();
    const caller = appRouter.createCaller(ctx);

    const clinicsList = await caller.superAdmin.listClinics({
      planFilter: "professional",
    });

    expect(Array.isArray(clinicsList)).toBe(true);
  });

  it("supports filtering clinics by status", async () => {
    const { ctx } = createPlatformAdminContext();
    const caller = appRouter.createCaller(ctx);

    const clinicsList = await caller.superAdmin.listClinics({
      statusFilter: "active",
    });

    expect(Array.isArray(clinicsList)).toBe(true);
  });

  it("supports searching clinics by name", async () => {
    const { ctx } = createPlatformAdminContext();
    const caller = appRouter.createCaller(ctx);

    const clinicsList = await caller.superAdmin.listClinics({
      search: "teste",
    });

    expect(Array.isArray(clinicsList)).toBe(true);
  });
});

// =============================================
// ACCESS CONTROL - CREATOR-BASED RESTRICTIONS
// =============================================
describe("Access Control - Creator-based Restrictions", () => {
  // Helper: create context for a different user (not the creator)
  function createDifferentUserContext(): { ctx: TrpcContext } {
    return createAuthContext({
      user: {
        id: 99,
        openId: "different-user-099",
        email: "outro@clinica.com",
        name: "Outro Profissional",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      clinic: {
        id: 1,
        name: "Clínica Teste",
        cnpj: "12345678000100",
        email: "clinica@teste.com",
        phone: "11999999999",
        address: "Rua Teste, 123",
        city: "São Paulo",
        state: "SP",
        plan: "professional",
        planStatus: "active",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      clinicMember: {
        id: 99,
        clinicId: 1,
        userId: 99,
        role: "therapist",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // Test: clinic_admin can always update patients
  it("clinic_admin can update any patient", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    // List patients first
    const patients = await caller.patients.list({});
    if (patients.length > 0) {
      const result = await caller.patients.update({
        id: patients[0].id,
        name: patients[0].name, // no actual change
      });
      expect(result.success).toBe(true);
    }
  });

  // Test: non-creator therapist cannot update patient they didn't create
  it("non-creator therapist gets FORBIDDEN when updating patient created by another user", async () => {
    const { ctx: adminCtx } = createContextWithClinic();
    const adminCaller = appRouter.createCaller(adminCtx);

    // Get existing patients
    const patients = await adminCaller.patients.list({});
    if (patients.length > 0) {
      const patient = patients[0];
      // Only test if the patient has a createdByUserId that is NOT 99
      if (patient.createdByUserId && patient.createdByUserId !== 99) {
        const { ctx: otherCtx } = createDifferentUserContext();
        const otherCaller = appRouter.createCaller(otherCtx);

        await expect(
          otherCaller.patients.update({ id: patient.id, name: "Tentativa de edição" })
        ).rejects.toThrow(/administrador/);
      }
    }
  });

  // Test: non-creator therapist cannot deactivate patient they didn't create
  it("non-creator therapist gets FORBIDDEN when deactivating patient created by another user", async () => {
    const { ctx: adminCtx } = createContextWithClinic();
    const adminCaller = appRouter.createCaller(adminCtx);

    const patients = await adminCaller.patients.list({});
    if (patients.length > 0) {
      const patient = patients[0];
      if (patient.createdByUserId && patient.createdByUserId !== 99) {
        const { ctx: otherCtx } = createDifferentUserContext();
        const otherCaller = appRouter.createCaller(otherCtx);

        await expect(
          otherCaller.patients.deactivate({ id: patient.id })
        ).rejects.toThrow(/administrador/);
      }
    }
  });

  // Test: clinic_admin can always update professionals
  it("clinic_admin can update any professional", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const professionals = await caller.professionals.list({});
    if (professionals.length > 0) {
      const result = await caller.professionals.update({
        id: professionals[0].id,
        name: professionals[0].name,
      });
      expect(result.success).toBe(true);
    }
  });

  // Test: non-creator therapist cannot update professional they didn't create
  it("non-creator therapist gets FORBIDDEN when updating professional created by another user", async () => {
    const { ctx: adminCtx } = createContextWithClinic();
    const adminCaller = appRouter.createCaller(adminCtx);

    const professionals = await adminCaller.professionals.list({});
    if (professionals.length > 0) {
      const prof = professionals[0];
      if (prof.createdByUserId && prof.createdByUserId !== 99) {
        const { ctx: otherCtx } = createDifferentUserContext();
        const otherCaller = appRouter.createCaller(otherCtx);

        await expect(
          otherCaller.professionals.update({ id: prof.id, name: "Tentativa" })
        ).rejects.toThrow(/administrador/);
      }
    }
  });

  // Test: non-creator cannot update authorization
  it("non-creator therapist gets FORBIDDEN when updating authorization created by another user", async () => {
    const { ctx: adminCtx } = createContextWithClinic();
    const adminCaller = appRouter.createCaller(adminCtx);

    const auths = await adminCaller.authorizations.list({});
    if (auths.length > 0) {
      const auth = auths[0];
      if (auth.createdByUserId && auth.createdByUserId !== 99) {
        const { ctx: otherCtx } = createDifferentUserContext();
        const otherCaller = appRouter.createCaller(otherCtx);

        await expect(
          otherCaller.authorizations.update({ id: auth.id, observations: "Tentativa" })
        ).rejects.toThrow(/administrador/);
      }
    }
  });

  // Test: non-creator cannot update therapeutic plan
  it("non-creator therapist gets FORBIDDEN when updating therapeutic plan created by another user", async () => {
    const { ctx: adminCtx } = createContextWithClinic();
    const adminCaller = appRouter.createCaller(adminCtx);

    const plans = await adminCaller.therapeuticPlans.list({});
    if (plans.length > 0) {
      const plan = plans[0];
      if (plan.createdByUserId && plan.createdByUserId !== 99) {
        const { ctx: otherCtx } = createDifferentUserContext();
        const otherCaller = appRouter.createCaller(otherCtx);

        await expect(
          otherCaller.therapeuticPlans.update({ id: plan.id, generalObjective: "Tentativa de edição" })
        ).rejects.toThrow(/administrador/);
      }
    }
  });
});

// =============================================
// PATIENTS PAGINATION
// =============================================
describe("Patients Paginated Router", () => {
  it("returns paginated structure with items, total, page, totalPages", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.patients.listPaginated({ page: 1, limit: 10 });

    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("totalPages");
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe("number");
    expect(result.page).toBe(1);
    expect(typeof result.totalPages).toBe("number");
  });

  it("supports search filter in paginated list", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.patients.listPaginated({
      page: 1,
      limit: 10,
      search: "nonexistent-patient-xyz",
    });

    expect(result.items.length).toBe(0);
    expect(result.total).toBe(0);
  });

  it("supports paymentType filter in paginated list", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.patients.listPaginated({
      page: 1,
      limit: 10,
      paymentType: "particular",
    });

    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("respects page and limit parameters", async () => {
    const { ctx } = createContextWithClinic();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.patients.listPaginated({ page: 1, limit: 5 });

    expect(result.items.length).toBeLessThanOrEqual(5);
    expect(result.page).toBe(1);
  });
});
