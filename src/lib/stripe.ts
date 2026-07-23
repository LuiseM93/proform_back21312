import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia" as Stripe.LatestApiVersion,
});

export const PRICE_IDS = {
  professional: {
    month: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    year: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  },
  business: {
    month: process.env.STRIPE_BIZ_MONTHLY_PRICE_ID!,
    year: process.env.STRIPE_BIZ_YEARLY_PRICE_ID!,
  },
} as const;
export type PlanKey = keyof typeof PRICE_IDS extends infer K ? Exclude<K, "extraDocument"> : never;
