import { z } from "zod";

export const BudgetSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
  currency: z.string().min(1)
});

export const ConstraintsSchema = z.object({
  shipping_days_max: z.number().int().positive().nullable().optional(),
  category_includes: z.array(z.string().min(1)).default([]),
  category_excludes: z.array(z.string().min(1)).default([])
});

export const RecipientProfileSchema = z.object({
  age: z.number().int().positive().nullable(),
  gender: z.string().min(1).nullable(),
  occasion: z.string().min(1).nullable(),
  budget: BudgetSchema,
  relationship: z.string().min(1).nullable(),
  interests: z.array(z.string().min(1)).default([]),
  favorite_color: z.string().min(1).nullable(),
  favorite_brands: z.array(z.string().min(1)).default([]),
  constraints: ConstraintsSchema.default({ category_excludes: [], category_includes: [] })
});

export type RecipientProfile = z.infer<typeof RecipientProfileSchema>;
