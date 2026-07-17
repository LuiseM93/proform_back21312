import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia" as any,
});

export const PRICE_IDS = {
  professional: {
    month: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    year: process.env.STRIPE_PRICE_PRO_YEARLY!,
  },
  business: {
    month: process.env.STRIPE_PRICE_BUSINESS_MONTHLY!,
    year: process.env.STRIPE_PRICE_BUSINESS_YEARLY!,
  },
  extraDocument: process.env.STRIPE_PRICE_EXTRA_DOC!,
} as const;

export type PlanKey = keyof typeof PRICE_IDS extends infer K ? Exclude<K, "extraDocument"> : never;
