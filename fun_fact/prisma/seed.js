const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const { DAYS, TIME_SLOTS, DAY_TIME_SLOTS } = require('../src/app/lib/constants');

async function main() {
  console.log('Starting to seed the database...');
  
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`Running in ${isProd ? 'production' : 'development'} mode`);
  
  // Check if tables exist before trying to query them
  let tablesExist = true;
  try {
    // Try to count students to see if the table exists
    await prisma.student.count();
  } catch (e) {
    if (e.code === 'P2021') {
      console.log('Tables do not exist yet. Will create from scratch.');
      tablesExist = false;
    } else {
      throw e; // Rethrow if it's not a "table doesn't exist" error
    }
  }
  
  // Load student data from JSON file
  const studentDataPath = path.join(__dirname, 'students.json');
  const studentData = JSON.parse(fs.readFileSync(studentDataPath, 'utf8'));
  
  // Seed students (only add missing ones if tables exist)
  console.log('Seeding students...');
  let createdStudents = 0;
  
  for (const studentInfo of studentData) {
    try {
      // Check if student already exists (only if tables exist)
      let shouldCreate = true;
      if (tablesExist) {
        const existingStudent = await prisma.student.findUnique({
          where: { id: studentInfo.id }
        });
        shouldCreate = !existingStudent;
      }
      
      if (shouldCreate) {
        // Create student if they don't exist
        await prisma.student.create({
          data: studentInfo
        });
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
  
  // Seed sessions (only add missing ones if tables exist)
  console.log('Seeding sessions...');
  let createdSessions = 0;
  
  for (const day of Object.values(DAYS)) {
    const timeSlots = DAY_TIME_SLOTS[day];
    
    for (const timeSlot of timeSlots) {
      try {
        // Check if session already exists (only if tables exist)
        let shouldCreate = true;
        if (tablesExist) {
          const existingSession = await prisma.session.findFirst({
            where: {
              day,
              timeSlot
            }
          });
          shouldCreate = !existingSession;
        }
        
        if (shouldCreate) {
          // Create session if it doesn't exist
          await prisma.session.create({
            data: {
              day,
              timeSlot,
              capacity: 4 // Default capacity is 4
            }
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
  