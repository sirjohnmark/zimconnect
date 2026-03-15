import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be 30 characters or fewer")
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers and underscores"),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  location: z.string().min(1, "Select your city"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type SignupSchema = z.infer<typeof signupSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
