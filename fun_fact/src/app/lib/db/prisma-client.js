import { PrismaClient } from '@prisma/client';

// Explicitly set the database URL
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

// Add prisma to the global type
const globalForPrisma = global;

// Prevent multiple instances of Prisma Client in development
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
