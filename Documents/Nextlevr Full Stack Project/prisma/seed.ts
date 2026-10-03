import {
  PrismaClient,
  UserRole,
  ClientStatus,
  CampaignType,
  CampaignStatus,
  LeadStatus,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from the workspace root .env file so that
// `npx prisma db seed` can resolve DATABASE_URL regardless of the package
// directory it is executed from.
const envPath = [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../.env')].find(
  (p) => fs.existsSync(p)
);
dotenv.config({ path: envPath });

const prisma = new PrismaClient();

const PASSWORD = 'NexLevr@2025';
const SALT_ROUNDS = 12;

/**
 * Development/demo seed script for the NexLevr platform.
 *
 * Clears existing data in dependency order and inserts:
 * - 3 users (Admin, Manager, Team Member) with bcrypt-hashed passwords
 * - 5 clients across different industries
 * - 8 campaigns of varied types and statuses
 * - 20 leads distributed across pipeline statuses
 * - 15 tasks with priorities and due dates
 * - Corresponding activities and notifications
 */
async function main(): Promise<void> {
  console.log('🌱 Starting development seed...');

  // Clear existing data in safe dependency order (children before parents).
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  console.log('🧹 Cleared existing seed data');

  // ─── Users ───
  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@nexlevr.com',
      passwordHash,
      name: 'Rahul Sharma',
      role: UserRole.ADMIN,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@nexlevr.com',
      passwordHash,
      name: 'Priya Patel',
      role: UserRole.MANAGER,
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'member@nexlevr.com',
      passwordHash,
      name: 'Arjun Kumar',
      role: UserRole.TEAM_MEMBER,
    },
  });

  const userList = [admin, manager, member];
  console.log(`👤 Created ${userList.length} users`);

  // ─── Clients ───
  const clientsData = [
    {
      name: 'Aarav Mehta',
      company: 'TechNova Solutions',
      email: 'aarav@technova.com',
      phone: '+91 98765 43210',
      industry: 'Technology',
      website: 'https://technova.com',
      status: ClientStatus.ACTIVE,
      notes: 'Long-term client focused on B2B SaaS growth.',
    },
    {
      name: 'Sneha Iyer',
      company: 'GreenLeaf Organics',
      email: 'sneha@greenleaf.in',
      phone: '+91 87654 32109',
      industry: 'Food & Beverage',
      website: 'https://greenleaf.in',
      status: ClientStatus.ACTIVE,
      notes: 'Sustainability-focused organic food brand.',
    },
    {
      name: 'Vikram Rao',
      company: 'UrbanSpaces Realty',
      email: 'vikram@urbanspaces.com',
      phone: '+91 76543 21098',
      industry: 'Real Estate',
      website: 'https://urbanspaces.com',
      status: ClientStatus.PROSPECT,
      notes: 'Interested in lead generation campaigns for premium properties.',
    },
    {
      name: 'Ananya Gupta',
      company: 'FitLife Studios',
      email: 'ananya@fitlife.co',
      phone: '+91 65432 10987',
      industry: 'Health & Fitness',
      website: 'https://fitlife.co',
      status: ClientStatus.ACTIVE,
      notes: 'Boutique fitness chain expanding to 5 new cities.',
    },
    {
      name: 'Karan Malhotra',
      company: 'EduSpark Learning',
      email: 'karan@eduspark.org',
      phone: '+91 54321 09876',
      industry: 'Education',
      website: 'https://eduspark.org',
      status: ClientStatus.INACTIVE,
      notes: 'Ed-tech platform currently paused for budget review.',
    },
  ];

  const clients = await Promise.all(
    clientsData.map((client) => prisma.client.create({ data: client }))
  );
  console.log(`🏢 Created ${clients.length} clients`);

  // ─── Campaigns ───
  const campaignsData = [
    {
      name: 'TechNova Q4 Product Launch',
      clientId: clients[0].id,
      description:
        'Multi-channel launch campaign for TechNova’s new analytics platform.',
      type: CampaignType.PAID_ADVERTISING,
      startDate: new Date('2025-10-01'),
      endDate: new Date('2025-12-31'),
      budget: 450000,
      status: CampaignStatus.ACTIVE,
      targetAudience: 'Enterprise CTOs and product managers',
      goals: 'Generate 500 qualified leads and 50 demo bookings',
    },
    {
      name: 'GreenLeaf Instagram Growth',
      clientId: clients[1].id,
      description:
        'Organic and paid social media campaign to grow Instagram presence.',
      type: CampaignType.SOCIAL_MEDIA,
      startDate: new Date('2025-09-15'),
      endDate: new Date('2025-11-30'),
      budget: 120000,
      status: CampaignStatus.ACTIVE,
      targetAudience: 'Health-conscious millennials in metro cities',
      goals: 'Reach 2M impressions and gain 25K followers',
    },
    {
      name: 'UrbanSpaces Premium Lead Gen',
      clientId: clients[2].id,
      description: 'Targeted lead generation for luxury residential projects.',
      type: CampaignType.PAID_ADVERTISING,
      startDate: new Date('2025-11-01'),
      endDate: new Date('2026-01-31'),
      budget: 300000,
      status: CampaignStatus.PLANNED,
      targetAudience: 'High-net-worth individuals aged 35-55',
      goals: 'Capture 200 high-intent buyer leads',
    },
    {
      name: 'FitLife New Year Challenge',
      clientId: clients[3].id,
      description:
        'Email and content marketing campaign for New Year fitness signups.',
      type: CampaignType.EMAIL_MARKETING,
      startDate: new Date('2025-12-20'),
      endDate: new Date('2026-02-15'),
      budget: 90000,
      status: CampaignStatus.DRAFT,
      targetAudience: 'Existing members and local fitness enthusiasts',
      goals: 'Drive 1,000 new membership trials',
    },
    {
      name: 'EduSpark SEO Foundation',
      clientId: clients[4].id,
      description: 'Technical SEO and content optimization project.',
      type: CampaignType.SEO,
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-11-30'),
      budget: 150000,
      status: CampaignStatus.PAUSED,
      targetAudience: 'Students and working professionals seeking upskilling',
      goals: 'Increase organic traffic by 40%',
    },
    {
      name: 'TechNova Content Authority',
      clientId: clients[0].id,
      description:
        'Thought leadership content marketing to build domain authority.',
      type: CampaignType.CONTENT_MARKETING,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-15'),
      budget: 200000,
      status: CampaignStatus.ACTIVE,
      targetAudience: 'B2B decision-makers in tech',
      goals: 'Publish 24 articles and generate 10K newsletter subscribers',
    },
    {
      name: 'GreenLeaf Festive Sale Blitz',
      clientId: clients[1].id,
      description:
        'Short-term paid advertising campaign around Diwali and New Year.',
      type: CampaignType.PAID_ADVERTISING,
      startDate: new Date('2025-10-20'),
      endDate: new Date('2026-01-05'),
      budget: 180000,
      status: CampaignStatus.ACTIVE,
      targetAudience: 'Gift buyers and health enthusiasts',
      goals: 'Achieve ₹50L in attributed revenue',
    },
    {
      name: 'FitLife Local SEO Sprint',
      clientId: clients[3].id,
      description: 'Local SEO campaign for new studio locations.',
      type: CampaignType.SEO,
      startDate: new Date('2025-11-01'),
      endDate: new Date('2026-02-28'),
      budget: 75000,
      status: CampaignStatus.PLANNED,
      targetAudience: 'Local searchers in target neighborhoods',
      goals: 'Rank in top 3 local map pack for 10 keywords',
    },
  ];

  const campaigns = await Promise.all(
    campaignsData.map((campaign) => prisma.campaign.create({ data: campaign }))
  );
  console.log(`📢 Created ${campaigns.length} campaigns`);

  // ─── Leads ───
  const leadsData = [
    {
      name: 'Rohan Desai',
      email: 'rohan.desai@example.com',
      phone: '+91 99887 76655',
      company: 'Desai Consulting',
      source: 'LinkedIn Ads',
      campaignIndex: 0,
      status: LeadStatus.NEW,
      value: 0,
      assignedIndex: 1,
    },
    {
      name: 'Meera Nair',
      email: 'meera.nair@example.com',
      phone: '+91 88776 65544',
      company: 'Nair Retail',
      source: 'Google Ads',
      campaignIndex: 0,
      status: LeadStatus.CONTACTED,
      value: 250000,
      assignedIndex: 1,
    },
    {
      name: 'Siddharth Jain',
      email: 'siddharth.j@example.com',
      phone: '+91 77665 54433',
      company: 'Jain Logistics',
      source: 'Paid Search',
      campaignIndex: 0,
      status: LeadStatus.QUALIFIED,
      value: 500000,
      assignedIndex: 1,
    },
    {
      name: 'Pooja Reddy',
      email: 'pooja.reddy@example.com',
      phone: '+91 66554 43322',
      company: 'Reddy Labs',
      source: 'LinkedIn Ads',
      campaignIndex: 0,
      status: LeadStatus.PROPOSAL,
      value: 750000,
      assignedIndex: 1,
    },
    {
      name: 'Aditya Bose',
      email: 'aditya.bose@example.com',
      phone: '+91 55443 32211',
      company: 'Bose Systems',
      source: 'Referral',
      campaignIndex: 0,
      status: LeadStatus.CONVERTED,
      value: 1200000,
      assignedIndex: 1,
    },
    {
      name: 'Neha Kapoor',
      email: 'neha.kapoor@example.com',
      phone: '+91 44332 21100',
      company: 'Kapoor Designs',
      source: 'Instagram',
      campaignIndex: 1,
      status: LeadStatus.NEW,
      value: 0,
      assignedIndex: 2,
    },
    {
      name: 'Varun Khanna',
      email: 'varun.khanna@example.com',
      phone: '+91 33221 10099',
      company: 'Khanna Foods',
      source: 'Instagram',
      campaignIndex: 1,
      status: LeadStatus.CONTACTED,
      value: 15000,
      assignedIndex: 2,
    },
    {
      name: 'Divya Menon',
      email: 'divya.menon@example.com',
      phone: '+91 22110 09988',
      company: 'Menon Wellness',
      source: 'Influencer',
      campaignIndex: 1,
      status: LeadStatus.QUALIFIED,
      value: 35000,
      assignedIndex: 2,
    },
    {
      name: 'Amit Sinha',
      email: 'amit.sinha@example.com',
      phone: '+91 11009 98877',
      company: 'Sinha Organics',
      source: 'Instagram',
      campaignIndex: 1,
      status: LeadStatus.CONVERTED,
      value: 60000,
      assignedIndex: 2,
    },
    {
      name: 'Kavya Agarwal',
      email: 'kavya.a@example.com',
      phone: '+91 90998 87766',
      company: 'Agarwal Estates',
      source: 'Facebook Ads',
      campaignIndex: 2,
      status: LeadStatus.NEW,
      value: 0,
      assignedIndex: 1,
    },
    {
      name: 'Rajesh Pillai',
      email: 'rajesh.pillai@example.com',
      phone: '+91 89887 76655',
      company: 'Pillai Holdings',
      source: 'Landing Page',
      campaignIndex: 2,
      status: LeadStatus.CONTACTED,
      value: 8000000,
      assignedIndex: 1,
    },
    {
      name: 'Sonia Verma',
      email: 'sonia.verma@example.com',
      phone: '+91 78776 65544',
      company: 'Verma Realty',
      source: 'Facebook Ads',
      campaignIndex: 2,
      status: LeadStatus.LOST,
      value: 0,
      assignedIndex: 1,
    },
    {
      name: 'Manish Tiwari',
      email: 'manish.t@example.com',
      phone: '+91 67665 54433',
      company: 'Tiwari Fitness',
      source: 'Email',
      campaignIndex: 3,
      status: LeadStatus.NEW,
      value: 0,
      assignedIndex: 2,
    },
    {
      name: 'Lakshmi Iyer',
      email: 'lakshmi.iyer@example.com',
      phone: '+91 56554 43322',
      company: 'Iyer Yoga',
      source: 'Email',
      campaignIndex: 3,
      status: LeadStatus.CONTACTED,
      value: 12000,
      assignedIndex: 2,
    },
    {
      name: 'Gaurav Chawla',
      email: 'gaurav.c@example.com',
      phone: '+91 45443 32211',
      company: 'Chawla Education',
      source: 'Organic Search',
      campaignIndex: 4,
      status: LeadStatus.NEW,
      value: 0,
      assignedIndex: 2,
    },
    {
      name: 'Ritu Bansal',
      email: 'ritu.bansal@example.com',
      phone: '+91 34332 21100',
      company: 'Bansal Classes',
      source: 'Blog',
      campaignIndex: 5,
      status: LeadStatus.QUALIFIED,
      value: 180000,
      assignedIndex: 1,
    },
    {
      name: 'Naveen Kulkarni',
      email: 'naveen.k@example.com',
      phone: '+91 23221 10099',
      company: 'Kulkarni Tech',
      source: 'Whitepaper',
      campaignIndex: 5,
      status: LeadStatus.PROPOSAL,
      value: 420000,
      assignedIndex: 1,
    },
    {
      name: 'Shalini Ghosh',
      email: 'shalini.g@example.com',
      phone: '+91 12110 09988',
      company: 'Ghosh Retail',
      source: 'Google Ads',
      campaignIndex: 6,
      status: LeadStatus.CONTACTED,
      value: 25000,
      assignedIndex: 2,
    },
    {
      name: 'Tarun Mehta',
      email: 'tarun.mehta@example.com',
      phone: '+91 01009 98877',
      company: 'Mehta Gifts',
      source: 'Instagram',
      campaignIndex: 6,
      status: LeadStatus.QUALIFIED,
      value: 45000,
      assignedIndex: 2,
    },
    {
      name: 'Priya Nambiar',
      email: 'priya.nambiar@example.com',
      phone: '+91 98989 87878',
      company: 'Nambiar Fitness',
      source: 'Local Search',
      campaignIndex: 7,
      status: LeadStatus.NEW,
      value: 0,
      assignedIndex: 2,
    },
  ];

  const leads = await Promise.all(
    leadsData.map((lead) =>
      prisma.lead.create({
        data: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          source: lead.source,
          campaignId: campaigns[lead.campaignIndex].id,
          status: lead.status,
          value: lead.value,
          assignedUserId: userList[lead.assignedIndex].id,
          notes: `Demo seed lead for ${lead.company}`,
        },
      })
    )
  );
  console.log(`🎯 Created ${leads.length} leads`);

  // ─── Tasks ───
  const tasksData = [
    {
      title: 'Draft TechNova campaign brief',
      description: 'Prepare initial campaign strategy document.',
      assignedIndex: 1,
      clientIndex: 0,
      campaignIndex: 0,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2025-10-05'),
      status: TaskStatus.COMPLETED,
    },
    {
      title: 'Design GreenLeaf ad creatives',
      description: 'Create carousel and story creatives for Instagram.',
      assignedIndex: 2,
      clientIndex: 1,
      campaignIndex: 1,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2025-09-25'),
      status: TaskStatus.IN_PROGRESS,
    },
    {
      title: 'Set up UrbanSpaces landing page',
      description: 'Build Unbounce landing page for premium properties.',
      assignedIndex: 1,
      clientIndex: 2,
      campaignIndex: 2,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2025-10-30'),
      status: TaskStatus.TODO,
    },
    {
      title: 'Write FitLife email sequence',
      description: '5-email nurture sequence for New Year challenge.',
      assignedIndex: 2,
      clientIndex: 3,
      campaignIndex: 3,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2025-12-15'),
      status: TaskStatus.REVIEW,
    },
    {
      title: 'Audit EduSpark site SEO',
      description: 'Technical SEO audit and recommendations.',
      assignedIndex: 2,
      clientIndex: 4,
      campaignIndex: 4,
      priority: TaskPriority.URGENT,
      dueDate: new Date('2025-11-10'),
      status: TaskStatus.IN_PROGRESS,
    },
    {
      title: 'Publish TechNova thought leadership article',
      description: 'Publish and distribute article on LinkedIn.',
      assignedIndex: 1,
      clientIndex: 0,
      campaignIndex: 5,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2025-10-20'),
      status: TaskStatus.TODO,
    },
    {
      title: 'Optimize GreenLeaf festive ad sets',
      description: 'A/B test audiences and creatives.',
      assignedIndex: 2,
      clientIndex: 1,
      campaignIndex: 6,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2025-11-15'),
      status: TaskStatus.IN_PROGRESS,
    },
    {
      title: 'Create FitLife local listings',
      description: 'Set up Google Business Profiles for new studios.',
      assignedIndex: 2,
      clientIndex: 3,
      campaignIndex: 7,
      priority: TaskPriority.LOW,
      dueDate: new Date('2025-11-20'),
      status: TaskStatus.TODO,
    },
    {
      title: 'Follow up with TechNova proposal leads',
      description: 'Schedule demo calls with qualified leads.',
      assignedIndex: 1,
      clientIndex: 0,
      campaignIndex: 0,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2025-10-28'),
      status: TaskStatus.IN_PROGRESS,
    },
    {
      title: 'Review GreenLeaf influencer contracts',
      description: 'Legal review and approval of influencer agreements.',
      assignedIndex: 1,
      clientIndex: 1,
      campaignIndex: 1,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2025-10-10'),
      status: TaskStatus.COMPLETED,
    },
    {
      title: 'Prepare UrbanSpaces ad copy',
      description: 'Write compelling copy for Facebook and Google ads.',
      assignedIndex: 2,
      clientIndex: 2,
      campaignIndex: 2,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2025-11-05'),
      status: TaskStatus.REVIEW,
    },
    {
      title: 'Segment FitLife email list',
      description: 'Segment users by location and engagement.',
      assignedIndex: 2,
      clientIndex: 3,
      campaignIndex: 3,
      priority: TaskPriority.LOW,
      dueDate: new Date('2025-12-10'),
      status: TaskStatus.TODO,
    },
    {
      title: 'Fix EduSpark broken backlinks',
      description: 'Identify and reclaim lost backlinks.',
      assignedIndex: 2,
      clientIndex: 4,
      campaignIndex: 4,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2025-11-25'),
      status: TaskStatus.IN_PROGRESS,
    },
    {
      title: 'Compile TechNova content calendar',
      description: 'Plan Q4 editorial calendar.',
      assignedIndex: 1,
      clientIndex: 0,
      campaignIndex: 5,
      priority: TaskPriority.LOW,
      dueDate: new Date('2025-10-15'),
      status: TaskStatus.COMPLETED,
    },
    {
      title: 'Analyze GreenLeaf festive campaign performance',
      description: 'Weekly performance report and optimization notes.',
      assignedIndex: 1,
      clientIndex: 1,
      campaignIndex: 6,
      priority: TaskPriority.URGENT,
      dueDate: new Date('2025-12-30'),
      status: TaskStatus.TODO,
    },
  ];

  const tasks = await Promise.all(
    tasksData.map((task) =>
      prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          assignedUserId: userList[task.assignedIndex].id,
          clientId: clients[task.clientIndex].id,
          campaignId: campaigns[task.campaignIndex].id,
          priority: task.priority,
          dueDate: task.dueDate,
          status: task.status,
        },
      })
    )
  );
  console.log(`✅ Created ${tasks.length} tasks`);

  // ─── Activities ───
  const activitiesData = [
    {
      userId: admin.id,
      action: 'SEED',
      entityType: 'SYSTEM',
      metadata: { detail: 'Development seed data created' },
    },
    {
      userId: manager.id,
      action: 'CREATED',
      entityType: 'CAMPAIGN',
      entityId: campaigns[0].id,
      metadata: { name: campaigns[0].name },
    },
    {
      userId: manager.id,
      action: 'CREATED',
      entityType: 'CAMPAIGN',
      entityId: campaigns[1].id,
      metadata: { name: campaigns[1].name },
    },
    {
      userId: member.id,
      action: 'UPDATED',
      entityType: 'LEAD',
      entityId: leads[1].id,
      metadata: { status: LeadStatus.CONTACTED },
    },
    {
      userId: member.id,
      action: 'UPDATED',
      entityType: 'LEAD',
      entityId: leads[3].id,
      metadata: { status: LeadStatus.PROPOSAL },
    },
    {
      userId: manager.id,
      action: 'CREATED',
      entityType: 'TASK',
      entityId: tasks[0].id,
      metadata: { title: tasks[0].title },
    },
    {
      userId: member.id,
      action: 'COMPLETED',
      entityType: 'TASK',
      entityId: tasks[0].id,
      metadata: { title: tasks[0].title },
    },
    {
      userId: admin.id,
      action: 'CREATED',
      entityType: 'USER',
      entityId: member.id,
      metadata: { email: member.email, role: member.role },
    },
  ];

  const activities = await Promise.all(
    activitiesData.map((activity) => prisma.activity.create({ data: activity }))
  );
  console.log(`📋 Created ${activities.length} activities`);

  // ─── Notifications ───
  const notificationsData = [
    {
      userId: manager.id,
      title: 'New lead assigned',
      message:
        'Rohan Desai has been assigned to you from TechNova Q4 Product Launch.',
      type: 'LEAD',
      relatedId: leads[0].id,
    },
    {
      userId: member.id,
      title: 'Task due soon',
      message: 'Design GreenLeaf ad creatives is due on Sep 25.',
      type: 'TASK',
      relatedId: tasks[1].id,
    },
    {
      userId: admin.id,
      title: 'Campaign budget alert',
      message: 'TechNova Q4 Product Launch has consumed 75% of budget.',
      type: 'CAMPAIGN',
      relatedId: campaigns[0].id,
    },
    {
      userId: manager.id,
      title: 'Lead converted',
      message: 'Aditya Bose from TechNova campaign has converted.',
      type: 'LEAD',
      relatedId: leads[4].id,
      read: true,
    },
    {
      userId: member.id,
      title: 'New task assigned',
      message: 'You have been assigned to write FitLife email sequence.',
      type: 'TASK',
      relatedId: tasks[3].id,
    },
  ];

  const notifications = await Promise.all(
    notificationsData.map((notification) =>
      prisma.notification.create({ data: notification })
    )
  );
  console.log(`🔔 Created ${notifications.length} notifications`);

  console.log('\n🎉 Development seed completed successfully!');
  console.log('─────────────────────────────────────────');
  console.log('Login credentials (all roles):');
  console.log('  Email: admin@nexlevr.com    | Password: NexLevr@2025 | Role: ADMIN');
  console.log(
    '  Email: manager@nexlevr.com  | Password: NexLevr@2025 | Role: MANAGER'
  );
  console.log(
    '  Email: member@nexlevr.com   | Password: NexLevr@2025 | Role: TEAM_MEMBER'
  );
  console.log('─────────────────────────────────────────');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
