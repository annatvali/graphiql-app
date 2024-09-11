import { z } from 'zod';
import { useTranslations } from 'next-intl';

export const signInSchema = (t: ReturnType<typeof useTranslations<'VALIDATION'>>) =>
  z.object({
    email: z
      .string()
      .email({ message: t('email-invalid') })
      .trim(),
    password: z
      .string()
      .min(8, { message: t('password-min-length') })
      .regex(/\p{L}/u, { message: t('password-must-contain-letter') })
      .regex(/\p{N}/u, { message: t('password-must-contain-digit') })
      .regex(/[ `!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>/?~]/u, { message: t('password-must-contain-special') })
      .trim(),
  });

export type SignInFormData = z.infer<ReturnType<typeof signInSchema>>;
