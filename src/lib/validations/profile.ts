// TODO: implement — use zod
import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z.string().min(2).max(60).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  avatar_url: z.string().url().optional(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
