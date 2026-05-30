import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { clinics, clinicMembers, users } from "../../drizzle/schema";

const clinicInput = z.object({
  name: z.string().min(3),
  cnpj: z.string().min(14),
  cnes: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  responsibleName: z.string().optional(),
  responsibleCpf: z.string().optional(),
});

export const clinicsRouter = router({
  // Obter a clínica do usuário atual
  myClinics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    
    const memberships = await db.select({
      clinic: clinics,
      role: clinicMembers.role,
    })
    .from(clinicMembers)
    .innerJoin(clinics, eq(clinics.id, clinicMembers.clinicId))
    .where(eq(clinicMembers.userId, ctx.user.id));
    
    return memberships;
  }),

  // Obter detalhes da clínica atual
  current: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.clinic) return null;
    return ctx.clinic;
  }),

  // Criar nova clínica (onboarding)
  create: protectedProcedure
    .input(clinicInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Criar a clínica
      const result = await db.insert(clinics).values({
        ...input,
        email: input.email || "",
        plan: "trial",
        planStatus: "trialing",
      });
      
      const clinicId = result[0].insertId;
      
      // Adicionar o criador como admin da clínica
      await db.insert(clinicMembers).values({
        clinicId,
        userId: ctx.user.id,
        role: "clinic_admin",
      });
      
      return { id: clinicId };
    }),

  // Atualizar dados da clínica
  update: protectedProcedure
    .input(z.object({ id: z.number() }).merge(clinicInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Verificar se é admin da clínica
      if (!ctx.clinicMember || ctx.clinicMember.role !== "clinic_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem editar dados da clínica" });
      }
      
      const { id, ...data } = input;
      await db.update(clinics).set(data).where(eq(clinics.id, id));
      return { success: true };
    }),

  // Listar membros da clínica
  listMembers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    if (!ctx.clinic) return [];
    
    const members = await db.select({
      id: clinicMembers.id,
      userId: clinicMembers.userId,
      role: clinicMembers.role,
      userName: users.name,
      userEmail: users.email,
      createdAt: clinicMembers.createdAt,
    })
    .from(clinicMembers)
    .innerJoin(users, eq(users.id, clinicMembers.userId))
    .where(eq(clinicMembers.clinicId, ctx.clinic.id));
    
    return members;
  }),

  // Adicionar membro à clínica
  addMember: protectedProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["clinic_admin", "therapist", "receptionist"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (!ctx.clinicMember || ctx.clinicMember.role !== "clinic_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem adicionar membros" });
      }
      if (!ctx.clinic) throw new TRPCError({ code: "FORBIDDEN", message: "Clínica não encontrada" });
      
      // Verificar se já é membro
      const existing = await db.select().from(clinicMembers)
        .where(and(
          eq(clinicMembers.clinicId, ctx.clinic.id),
          eq(clinicMembers.userId, input.userId),
        )).limit(1);
      
      if (existing.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário já é membro desta clínica" });
      }
      
      const result = await db.insert(clinicMembers).values({
        clinicId: ctx.clinic.id,
        userId: input.userId,
        role: input.role,
      });
      
      return { id: result[0].insertId };
    }),

  // Atualizar papel de membro
  updateMemberRole: protectedProcedure
    .input(z.object({
      memberId: z.number(),
      role: z.enum(["clinic_admin", "therapist", "receptionist"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (!ctx.clinicMember || ctx.clinicMember.role !== "clinic_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem alterar papéis" });
      }
      
      await db.update(clinicMembers)
        .set({ role: input.role })
        .where(eq(clinicMembers.id, input.memberId));
      
      return { success: true };
    }),

  // Remover membro
  removeMember: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      if (!ctx.clinicMember || ctx.clinicMember.role !== "clinic_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem remover membros" });
      }
      
      // Não permitir remover a si mesmo
      if (ctx.clinicMember.id === input.memberId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode remover a si mesmo da clínica" });
      }
      
      await db.delete(clinicMembers).where(eq(clinicMembers.id, input.memberId));
      return { success: true };
    }),

  // Selecionar clínica ativa (para usuários com múltiplas clínicas)
  selectClinic: protectedProcedure
    .input(z.object({ clinicId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Verificar se o usuário é membro da clínica
      const membership = await db.select().from(clinicMembers)
        .where(and(
          eq(clinicMembers.clinicId, input.clinicId),
          eq(clinicMembers.userId, ctx.user.id),
        )).limit(1);
      
      if (membership.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não é membro desta clínica" });
      }
      
      return { clinicId: input.clinicId, role: membership[0].role };
    }),
});
