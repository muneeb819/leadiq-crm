-- Intent-monitoring fields + the indexes the discovery pipeline queries on.
ALTER TABLE "leads" ADD COLUMN "intentUrl" TEXT;
ALTER TABLE "leads" ADD COLUMN "budget" TEXT;
ALTER TABLE "leads" ADD COLUMN "vertical" TEXT;

CREATE INDEX "leads_email_idx"          ON "leads"("email");
CREATE INDEX "leads_ownerId_idx"        ON "leads"("ownerId");
CREATE INDEX "leads_companyId_idx"      ON "leads"("companyId");
CREATE INDEX "leads_vertical_idx"       ON "leads"("vertical");
CREATE INDEX "leads_pipelineStage_idx"  ON "leads"("pipelineStage");
CREATE INDEX "leads_createdAt_idx"      ON "leads"("createdAt");
