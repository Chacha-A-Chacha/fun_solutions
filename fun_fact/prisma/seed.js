const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { DAYS, TIME_SLOTS, DAY_TIME_SLOTS } = require('../src/lib/constants');

async function main() {
  console.log('Starting to seed the database...');
  
  // Clear existing sessions
  await prisma.booking.deleteMany({});
  await prisma.session.deleteMany({});
  
  // Create sessions for each day and appropriate time slots
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
  