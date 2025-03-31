const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const { DAYS, TIME_SLOTS, DAY_TIME_SLOTS } = require('../src/app/lib/constants');

async function main() {
  console.log('Starting to seed the database...');
  
  // Clear existing data
  await prisma.booking.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.student.deleteMany({});
  
  // Load student data from JSON file
  const studentDataPath = path.join(__dirname, 'students.json');
  const studentData = JSON.parse(fs.readFileSync(studentDataPath, 'utf8'));
  
  // Create students
  console.log('Seeding students...');
  for (const student of studentData) {
    await prisma.student.create({
      data: student
    });
    console.log(`Created student: ${student.name} (${student.id})`);
  }
  
  // Create sessions for each day and appropriate time slots
  console.log('Seeding sessions...');
  for (const day of Object.values(DAYS)) {
    const timeSlots = DAY_TIME_SLOTS[day];
    
    for (const timeSlot of timeSlots) {
      await prisma.session.create({
        data: {
          day,
          timeSlot,
          capacity: 4 // Default capacity is 4
        }
      });
      
      console.log(`Created session for ${day} at time slot ${timeSlot}`);
    }
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
