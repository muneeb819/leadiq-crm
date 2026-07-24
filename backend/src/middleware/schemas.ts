import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  ),
  name: z.string().min(1, 'Name is required').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  source: z.string().max(50).optional(),
  pipelineStage: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST']).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateLeadSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  source: z.string().max(50).optional(),
  pipelineStage: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST']).optional(),
  notes: z.string().max(2000).optional(),
  score: z.number().min(0).max(100).optional(),
  scoreReason: z.string().max(2000).optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200),
  domain: z.string().url('Invalid URL').optional().or(z.literal('')),
  industry: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  location: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

export const moveLeadSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  stage: z.string().min(1, 'Stage is required'),
});

export const draftEmailSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
});

export const sendEmailSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  subject: z.string().min(1, 'Subject is required').max(200),
  body: z.string().min(1, 'Body is required').max(10000),
});

export const discoverSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200),
  sources: z.array(z.string()).optional(),
});
