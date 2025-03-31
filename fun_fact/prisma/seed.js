const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const { DAYS, TIME_SLOTS, DAY_TIME_SLOTS } = require('../src/app/lib/constants');

async function main() {
  console.log('Starting to seed the database...');
  
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`Running in ${isProd ? 'production' : 'development'} mode`);
  
  // In development, we can optionally clear the database first
  if (!isProd) {
    // Uncomment this section if you want to clear the database in development
    // console.log('Development mode: Clearing existing data...');
    // await prisma.booking.deleteMany({});
    // await prisma.session.deleteMany({});
    // await prisma.student.deleteMany({});
  }
  
  // Load student data from JSON file
  const studentDataPath = path.join(__dirname, 'students.json');
  const studentData = JSON.parse(fs.readFileSync(studentDataPath, 'utf8'));
  
  // Seed students (only add missing ones)
  console.log('Seeding students...');
  let createdStudents = 0;
  
  for (const studentInfo of studentData) {
    // Check if student already exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentInfo.id }
    });
    
    if (!existingStudent) {
      // Only create student if they don't exist
      await prisma.student.create({
        data: studentInfo
      });
      console.log(`Created new student: ${studentInfo.name} (${studentInfo.id})`);
      createdStudents++;
    } else {
      console.log(`Student ${studentInfo.id} already exists, skipping`);
    }
  }
  
  console.log(`Added ${createdStudents} new students`);
  
  // Seed sessions (only add missing ones)
  console.log('Seeding sessions...');
  let createdSessions = 0;
  
  for (const day of Object.values(DAYS)) {
    const timeSlots = DAY_TIME_SLOTS[day];
    
    for (const timeSlot of timeSlots) {
      // Check if session already exists
      const existingSession = await prisma.session.findFirst({
        where: {
          day,
          timeSlot
        }
      });
      
      if (!existingSession) {
        // Only create session if it doesn't exist
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
  