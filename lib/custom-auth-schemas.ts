import { z } from "zod";
import { validatePasswordStrength } from "@/lib/password";

export const loginBodySchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const registerBodySchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(120),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .superRefine((data, ctx) => {
    const strength = validatePasswordStrength(data.password);
    if (strength) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: strength, path: ["password"] });
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });
