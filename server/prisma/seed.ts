import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash('Admin123!', 12)

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@businessvalue365.com' },
    update: {},
    create: {
      email: 'superadmin@businessvalue365.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@businessvalue365.com' },
    update: {},
    create: {
      email: 'admin@businessvalue365.com',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Johnson',
      role: 'ADMIN',
      isActive: true,
    },
  })

  // Demo company 1
  const company1 = await prisma.company.upsert({
    where: { id: 'demo-company-1' },
    update: {},
    create: {
      id: 'demo-company-1',
      name: 'Acme Corp',
      industry: 'Technology',
      website: 'https://acme.example.com',
      status: 'ACTIVE',
      accountManagerId: admin.id,
      onboardingStage: 'Documentation',
      tags: ['priority', 'enterprise'],
    },
  })

  // Demo company 2
  const company2 = await prisma.company.upsert({
    where: { id: 'demo-company-2' },
    update: {},
    create: {
      id: 'demo-company-2',
      name: 'TechStart Inc',
      industry: 'SaaS',
      website: 'https://techstart.example.com',
      status: 'ACTIVE',
      accountManagerId: admin.id,
      onboardingStage: 'Requirements',
      tags: ['startup'],
    },
  })

  // Contact
  const contact = await prisma.contact.upsert({
    where: { id: 'demo-contact-1' },
    update: {},
    create: {
      id: 'demo-contact-1',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@acme.example.com',
      phone: '+1-555-0100',
      designation: 'CEO',
      companyId: company1.id,
      inviteStatus: 'PENDING',
      isActive: true,
    },
  })

  // Sample tickets
  const tickets = [
    {
      title: 'Upload company registration documents',
      description: 'Please upload the latest version of your company registration certificate.',
      type: 'FILE_COLLECTION' as const,
      status: 'WAITING_FOR_CLIENT' as const,
      priority: 'HIGH' as const,
      companyId: company1.id,
      assigneeId: admin.id,
    },
    {
      title: 'Approve service agreement',
      description: 'Review and approve the attached service agreement document.',
      type: 'APPROVAL_REQUEST' as const,
      status: 'OPEN' as const,
      priority: 'URGENT' as const,
      companyId: company1.id,
      assigneeId: admin.id,
    },
    {
      title: 'Onboarding kickoff meeting notes',
      description: 'Review the kickoff meeting notes and confirm next steps.',
      type: 'GENERAL_TASK' as const,
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      companyId: company2.id,
      assigneeId: admin.id,
    },
    {
      title: 'Technical requirements document',
      description: 'Fill out the technical requirements form for system integration.',
      type: 'REQUIREMENT_REQUEST' as const,
      status: 'OPEN' as const,
      priority: 'HIGH' as const,
      companyId: company2.id,
      assigneeId: admin.id,
    },
    {
      title: 'Billing information setup',
      description: 'Provide billing contact and payment method details.',
      type: 'GENERAL_TASK' as const,
      status: 'COMPLETED' as const,
      priority: 'LOW' as const,
      companyId: company1.id,
      assigneeId: admin.id,
    },
  ]

  for (const [i, ticketData] of tickets.entries()) {
    await prisma.ticket.upsert({
      where: { id: `demo-ticket-${i + 1}` },
      update: {},
      create: { id: `demo-ticket-${i + 1}`, ...ticketData, tags: [] },
    })
  }

  // Default email templates
  await prisma.emailTemplate.upsert({
    where: { name: 'invitation' },
    update: {},
    create: {
      name: 'invitation',
      subject: 'You have been invited to {{portal_name}}',
      htmlBody: '<p>Hi {{first_name}}, click <a href="{{invite_url}}">here</a> to accept your invitation.</p>',
      variables: ['first_name', 'portal_name', 'invite_url'],
    },
  })

  // Default settings
  const defaults = [
    { key: 'auto_close_days', value: '30' },
    { key: 'reminder_frequency_hours', value: '24' },
    { key: 'escalation_hours', value: '72' },
  ]
  for (const s of defaults) {
    const existing = await prisma.setting.findFirst({ where: { key: s.key, companyId: null } })
    if (!existing) await prisma.setting.create({ data: { key: s.key, value: s.value } })
  }

  console.log('✅ Seed complete.')
  console.log('   SuperAdmin: superadmin@businessvalue365.com / Admin123!')
  console.log('   Admin:      admin@businessvalue365.com / Admin123!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
