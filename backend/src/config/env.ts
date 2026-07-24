import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  REDIS_PASSWORD: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  AI_AGENTS_URL: z.string().default('http://ai-agents:8000'),
  ANTHROPIC_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),
  LOG_LEVEL: z.string().default('debug'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

const unsafeDefaults = ['change_this_to_a_very_long_random_secret_at_least_256_bits_long', 'change_this_to_another_very_long_random_secret_for_refresh_tokens'];
if (unsafeDefaults.includes(parsed.data.JWT_SECRET) || unsafeDefaults.includes(parsed.data.JWT_REFRESH_SECRET)) {
  console.error('JWT_SECRET and JWT_REFRESH_SECRET must be changed from default values. Generate with: openssl rand -base64 64');
  process.exit(1);
}

export const env = parsed.data;
