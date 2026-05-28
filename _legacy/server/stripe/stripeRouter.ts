import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { clinics } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { PLANS, PlanId } from "./products.ts";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

export const stripeRouter = router({
  // Obter planos disponíveis
  getPlans: protectedProcedure.query(() => {
    return Object.values(PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      interval: plan.interval,
      features: plan.features,
      maxProfessionals: plan.maxProfessionals,
      maxPatients: plan.maxPatients,
    }));
  }),

  // Criar sessão de checkout para assinatura
  createCheckoutSession: protectedProcedure
    .input(z.object({
      planId: z.enum(["basic", "professional", "enterprise"]),
      clinicId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const plan = PLANS[input.planId as PlanId];
      if (!plan) throw new TRPCError({ code: "BAD_REQUEST", message: "Plano não encontrado" });

      // Verificar se a clínica pertence ao usuário
      const clinicResult = await db.select().from(clinics)
        .where(eq(clinics.id, input.clinicId)).limit(1);
      
      if (!clinicResult[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Clínica não encontrada" });

      const origin = ctx.req.headers.origin || `${ctx.req.protocol}://${ctx.req.get("host")}`;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        allow_promotion_codes: true,
        customer_email: ctx.user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          clinic_id: input.clinicId.toString(),
          plan_id: input.planId,
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
        },
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: `PEET - Plano ${plan.name}`,
                description: plan.description,
              },
              unit_amount: plan.price,
              recurring: {
                interval: plan.interval,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/settings/billing?success=true`,
        cancel_url: `${origin}/settings/billing?canceled=true`,
      });

      return { url: session.url };
    }),

  // Obter status da assinatura da clínica
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.clinic) return null;

    const db = await getDb();
    if (!db) return null;

    const clinicResult = await db.select().from(clinics)
      .where(eq(clinics.id, ctx.clinic.id)).limit(1);
    
    if (!clinicResult[0]) return null;

    const clinic = clinicResult[0];
    
    // Se tem subscription no Stripe, buscar detalhes
    if (clinic.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(clinic.stripeSubscriptionId);
        return {
          plan: clinic.plan,
          status: subscription.status,
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        };
      } catch {
        return {
          plan: clinic.plan,
          status: clinic.planStatus,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        };
      }
    }

    return {
      plan: clinic.plan,
      status: clinic.planStatus,
      currentPeriodEnd: clinic.trialEndsAt,
      cancelAtPeriodEnd: false,
    };
  }),

  // Criar portal de gerenciamento do cliente
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.clinic) throw new TRPCError({ code: "FORBIDDEN", message: "Clínica não encontrada" });

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const clinicResult = await db.select().from(clinics)
      .where(eq(clinics.id, ctx.clinic.id)).limit(1);
    
    if (!clinicResult[0]?.stripeCustomerId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma assinatura ativa encontrada" });
    }

    const origin = ctx.req.headers.origin || `${ctx.req.protocol}://${ctx.req.get("host")}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: clinicResult[0].stripeCustomerId,
      return_url: `${origin}/settings/billing`,
    });

    return { url: session.url };
  }),
});
