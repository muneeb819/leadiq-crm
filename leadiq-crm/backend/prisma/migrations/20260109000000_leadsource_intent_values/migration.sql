-- New LeadSource values for the intent-monitoring sources.
-- Kept in its OWN migration on purpose: PostgreSQL cannot use a newly added
-- enum value in the same transaction that created it, so these must be
-- committed separately from anything that references them.
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'HACKERNEWS';
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'REDDIT';
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'FREELANCER';
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'JOB_BOARD';
