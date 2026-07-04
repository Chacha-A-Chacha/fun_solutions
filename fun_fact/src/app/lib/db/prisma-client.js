import { PrismaClient } from '../../../../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  connectTimeout: 5000,
  acquireTimeout: 5000,
  // Needed for local MySQL 8 (caching_sha2_password) over a non-TLS socket: after
  // a MySQL restart the credential cache clears and the driver must fetch the RSA
  // public key. No-op on the production MariaDB (native-password auth).
  allowPublicKeyRetrieval: true,
});

// Add prisma to the global type
const globalForPrisma = global;

// Prevent multiple instances of Prisma Client in development
const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter,
    transactionOptions: {
      maxWait: 10000,
      timeout: 30000,
    },
  });
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
