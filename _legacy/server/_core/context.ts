import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User, ClinicMember, Clinic } from "../../drizzle/schema";
import { clinicMembers, clinics } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sdk } from "./sdk";
import { getDb } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  clinicMember: ClinicMember | null;
  clinic: Clinic | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let clinicMember: ClinicMember | null = null;
  let clinic: Clinic | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }

  // Se o usuário está autenticado, buscar sua clínica ativa
  if (user) {
    try {
      const db = await getDb();
      if (db) {
        const memberResult = await db.select().from(clinicMembers)
          .where(and(
            eq(clinicMembers.userId, user.id),
            eq(clinicMembers.active, true),
          ))
          .limit(1);

        if (memberResult[0]) {
          clinicMember = memberResult[0];
          const clinicResult = await db.select().from(clinics)
            .where(eq(clinics.id, memberResult[0].clinicId))
            .limit(1);
          if (clinicResult[0]) {
            clinic = clinicResult[0];
          }
        }
      }
    } catch (error) {
      // Silently fail - user may not be in any clinic yet
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    clinicMember,
    clinic,
  };
}
