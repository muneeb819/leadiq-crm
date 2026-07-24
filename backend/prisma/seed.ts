import { PrismaClient, Role, LeadSource, LeadStatus, ActivityType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@leadiq.com' },
    update: {},
    create: {
      email: 'admin@leadiq.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  const demoPassword = await bcrypt.hash('Demo1234!', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@leadiq.com' },
    update: {},
    create: {
      email: 'demo@leadiq.com',
      passwordHash: demoPassword,
      name: 'Demo User',
      role: Role.USER,
    },
  });

  // Pipeline stages
  const stages = [
    { name: 'discovery', label: 'Discovery', color: '#6366f1', order: 1 },
    { name: 'qualified', label: 'Qualified', color: '#f59e0b', order: 2 },
    { name: 'proposal', label: 'Proposal', color: '#3b82f6', order: 3 },
    { name: 'negotiation', label: 'Negotiation', color: '#8b5cf6', order: 4 },
    { name: 'won', label: 'Won', color: '#10b981', order: 5 },
    { name: 'lost', label: 'Lost', color: '#ef4444', order: 6 },
  ];

  for (const stage of stages) {
    await prisma.pipelineStage.upsert({
      where: { name: stage.name },
      update: {},
      create: stage,
    });
  }

  // Demo companies
  const companies = [
    { name: 'Stripe', domain: 'stripe.com', industry: 'FinTech', size: '1000-5000', location: 'San Francisco, CA', website: 'https://stripe.com' },
    { name: 'Vercel', domain: 'vercel.com', industry: 'Developer Tools', size: '100-500', location: 'San Francisco, CA', website: 'https://vercel.com' },
    { name: 'Linear', domain: 'linear.app', industry: 'Project Management', size: '50-100', location: 'San Francisco, CA', website: 'https://linear.app' },
    { name: 'Notion', domain: 'notion.so', industry: 'Productivity', size: '500-1000', location: 'San Francisco, CA', website: 'https://notion.so' },
    { name: 'Figma', domain: 'figma.com', industry: 'Design Tools', size: '500-1000', location: 'San Francisco, CA', website: 'https://figma.com' },
  ];

  const createdCompanies: any[] = [];
  for (const company of companies) {
    const c = await prisma.company.upsert({
      where: { domain: company.domain },
      update: {},
      create: company,
    });
    createdCompanies.push(c);
  }

  // Demo leads
  const leads = [
    { firstName: 'Alex', lastName: 'Chen', email: 'alex@stripe.com', title: 'VP of Engineering', source: LeadSource.LINKEDIN, status: LeadStatus.QUALIFIED, score: 87, pipelineStage: 'qualified', companyId: createdCompanies[0].id, enriched: true, tags: ['decision-maker', 'technical'] },
    { firstName: 'Sarah', lastName: 'Kim', email: 'sarah@vercel.com', title: 'Head of Growth', source: LeadSource.PRODUCT_HUNT, status: LeadStatus.CONTACTED, score: 73, pipelineStage: 'discovery', companyId: createdCompanies[1].id, enriched: true, tags: ['growth', 'marketing'] },
    { firstName: 'James', lastName: 'Park', email: 'james@linear.app', title: 'CTO', source: LeadSource.GITHUB, status: LeadStatus.PROPOSAL, score: 91, pipelineStage: 'proposal', companyId: createdCompanies[2].id, enriched: true, tags: ['decision-maker', 'founder'] },
    { firstName: 'Mia', lastName: 'Wong', email: 'mia@notion.so', title: 'Product Manager', source: LeadSource.SERP, status: LeadStatus.NEW, score: 54, pipelineStage: 'discovery', companyId: createdCompanies[3].id, enriched: false, tags: ['product'] },
    { firstName: 'Lucas', lastName: 'Martinez', email: 'lucas@figma.com', title: 'Engineering Manager', source: LeadSource.LINKEDIN, status: LeadStatus.NEGOTIATION, score: 82, pipelineStage: 'negotiation', companyId: createdCompanies[4].id, enriched: true, tags: ['technical', 'manager'] },
    { firstName: 'Emma', lastName: 'Thompson', email: 'emma@example.com', title: 'CEO', source: LeadSource.REFERRAL, status: LeadStatus.WON, score: 95, pipelineStage: 'won', enriched: true, tags: ['founder', 'decision-maker'] },
    { firstName: 'David', lastName: 'Lee', email: 'david@startup.io', title: 'Founder', source: LeadSource.GITHUB, status: LeadStatus.NEW, score: 68, pipelineStage: 'discovery', enriched: false, tags: ['founder'] },
    { firstName: 'Nina', lastName: 'Patel', email: 'nina@techcorp.com', title: 'VP Sales', source: LeadSource.MANUAL, status: LeadStatus.LOST, score: 41, pipelineStage: 'lost', enriched: false, tags: ['sales'] },
  ];

  for (const lead of leads) {
    await prisma.lead.create({
      data: { ...lead, ownerId: admin.id },
    });
  }

  // Sample activities
  const allLeads = await prisma.lead.findMany({ take: 3 });
  for (const lead of allLeads) {
    await prisma.activity.create({
      data: {
        type: ActivityType.LEAD_CREATED,
        title: 'Lead created',
        body: `Lead ${lead.firstName} ${lead.lastName} was added to the CRM`,
        leadId: lead.id,
        userId: admin.id,
      },
    });
    if (lead.enriched) {
      await prisma.activity.create({
        data: {
          type: ActivityType.LEAD_ENRICHED,
          title: 'Lead enriched by AI',
          body: 'AI agent enriched lead profile with company data and insights',
          leadId: lead.id,
          userId: admin.id,
        },
      });
    }
  }

  console.log('✅ Seed complete!');
  console.log('   Admin: admin@leadiq.com / Admin1234!');
  console.log('   Demo:  demo@leadiq.com / Demo1234!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
