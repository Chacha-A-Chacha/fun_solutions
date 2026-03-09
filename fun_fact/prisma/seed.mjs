import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.ts';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import constants (CommonJS module)
const require = createRequire(import.meta.url);
const { DAYS, TIME_SLOTS, DAY_TIME_SLOTS } = require('../src/app/lib/constants');

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: parseInt(process.env.DATABASE_PORT || '3306'),
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting to seed the database...');

  const isProd = process.env.NODE_ENV === 'production';
  console.log(`Running in ${isProd ? 'production' : 'development'} mode`);

  // Check if tables exist before trying to query them
  let tablesExist = true;
  try {
    await prisma.student.count();
  } catch (e) {
    if (e.code === 'P2021') {
      console.log('Tables do not exist yet. Will create from scratch.');
      tablesExist = false;
    } else {
      throw e;
    }
  }

  // Load student data from JSON file
  const studentDataPath = path.join(__dirname, 'students.json');
  const studentData = JSON.parse(fs.readFileSync(studentDataPath, 'utf8'));

  // Seed students
  console.log('Seeding students...');
  let createdStudents = 0;

  for (const studentInfo of studentData) {
    try {
      let shouldCreate = true;
      if (tablesExist) {
        const existingStudent = await prisma.student.findUnique({
          where: { id: studentInfo.id }
        });
        shouldCreate = !existingStudent;
      }

      if (shouldCreate) {
        await prisma.student.create({ data: studentInfo });
        console.log(`Created new student: ${studentInfo.name} (${studentInfo.id})`);
        createdStudents++;
      } else {
        console.log(`Student ${studentInfo.id} already exists, skipping`);
      }
    } catch (error) {
      console.error(`Error processing student ${studentInfo.id}:`, error);
    }
  }

  console.log(`Added ${createdStudents} new students`);

  // Seed sessions
  console.log('Seeding sessions...');
  let createdSessions = 0;

  for (const day of Object.values(DAYS)) {
    const timeSlots = DAY_TIME_SLOTS[day];

    for (const timeSlot of timeSlots) {
      try {
        let shouldCreate = true;
        if (tablesExist) {
          const existingSession = await prisma.session.findFirst({
            where: { day, timeSlot }
          });
          shouldCreate = !existingSession;
        }

        if (shouldCreate) {
          await prisma.session.create({
            data: { day, timeSlot, capacity: 4 }
          });
          console.log(`Created new session for ${day} at time slot ${timeSlot}`);
          createdSessions++;
        } else {
          console.log(`Session for ${day} at time slot ${timeSlot} already exists, skipping`);
        }
      } catch (error) {
        console.error(`Error processing session for ${day} at ${timeSlot}:`, error);
      }
    }
  }

  console.log(`Added ${createdSessions} new sessions`);

  // Seed staff users (admin + instructor)
  console.log('Seeding staff users...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'changeme123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  const staffUsers = [
    { email: adminEmail, name: 'System Admin', role: 'ADMIN' },
    { email: 'instructor@example.com', name: 'Default Instructor', role: 'INSTRUCTOR' },
  ];

  for (const staff of staffUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: staff.email }
    });

    if (!existing) {
      await prisma.user.create({
        data: { ...staff, password: hashedPassword }
      });
      console.log(`${staff.role} created (email: ${staff.email})`);
    } else {
      console.log(`${staff.role} ${staff.email} already exists, skipping`);
    }
  }

  // Seed system settings (upsert to preserve admin changes)
  console.log('Seeding system settings...');
  const defaultSettings = [
    { key: 'max_capacity_per_session', value: '4', label: 'Maximum students per session', type: 'number' },
    { key: 'max_days_per_week', value: '3', label: 'Maximum days a student can book per week', type: 'number' },
    { key: 'max_sessions_per_day', value: '1', label: 'Maximum sessions per day per student', type: 'number' },
    { key: 'total_practicals_required', value: '15', label: 'Total practicals to complete the course', type: 'number' },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      create: setting,
      update: {}, // Don't overwrite if already set by admin
    });
    console.log(`Setting "${setting.key}" ensured (default: ${setting.value})`);
  }

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
