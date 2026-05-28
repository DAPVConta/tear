import express from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import { clinics } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

export function registerStripeWebhook(app: express.Application) {
  // IMPORTANT: Must use express.raw() for webhook signature verification
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      console.error("[Stripe Webhook] Missing signature or webhook secret");
      return res.status(400).send("Missing signature or webhook secret");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(session);
          break;
        }
        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(invoice);
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          await handlePaymentFailed(invoice);
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription);
          break;
        }
        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`[Stripe Webhook] Error processing event ${event.type}:`, error);
    }

    res.json({ received: true });
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) return;

  const clinicId = session.metadata?.clinic_id;
  const planId = session.metadata?.plan_id;

  if (!clinicId || !planId) {
    console.error("[Stripe Webhook] Missing clinic_id or plan_id in metadata");
    return;
  }

  // Atualizar a clínica com os dados do Stripe
  await db.update(clinics).set({
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: session.subscription as string,
    plan: planId as "basic" | "professional" | "enterprise",
    planStatus: "active",
  }).where(eq(clinics.id, parseInt(clinicId)));

  console.log(`[Stripe Webhook] Clinic ${clinicId} upgraded to plan ${planId}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const db = await getDb();
  if (!db) return;

  const subscriptionId = (invoice as any).subscription;
  if (subscriptionId) {
    const subId = typeof subscriptionId === "string" ? subscriptionId : subscriptionId.id;
    
    await db.update(clinics).set({
      planStatus: "active",
    }).where(eq(clinics.stripeSubscriptionId, subId));

    console.log(`[Stripe Webhook] Invoice paid for subscription ${subId}`);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const db = await getDb();
  if (!db) return;

  const subscriptionId = (invoice as any).subscription;
  if (subscriptionId) {
    const subId = typeof subscriptionId === "string" ? subscriptionId : subscriptionId.id;
    
    await db.update(clinics).set({
      planStatus: "past_due",
    }).where(eq(clinics.stripeSubscriptionId, subId));

    console.log(`[Stripe Webhook] Payment failed for subscription ${subId}`);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const db = await getDb();
  if (!db) return;

  const status = subscription.status === "active" ? "active" : 
                 subscription.status === "past_due" ? "past_due" : 
                 subscription.status === "canceled" ? "canceled" : "active";

  await db.update(clinics).set({
    planStatus: status,
  }).where(eq(clinics.stripeSubscriptionId, subscription.id));

  console.log(`[Stripe Webhook] Subscription ${subscription.id} updated to status: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const db = await getDb();
  if (!db) return;

  await db.update(clinics).set({
    plan: "trial",
    planStatus: "canceled",
    stripeSubscriptionId: null,
  }).where(eq(clinics.stripeSubscriptionId, subscription.id));

  console.log(`[Stripe Webhook] Subscription ${subscription.id} canceled`);
}
