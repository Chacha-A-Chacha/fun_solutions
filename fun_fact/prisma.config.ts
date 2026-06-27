import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Connection is handled by the MariaDB adapter at runtime via individual
    // DATABASE_* env vars, not DATABASE_URL. This placeholder satisfies
    // `prisma generate` without requiring DATABASE_URL (absent on Vercel).
    // Read process.env directly so it never throws when the var is unset —
    // prisma/config's env() helper errors at config-load on a missing var.
    url: process.env.DATABASE_URL || "mysql://root@localhost:3306/placeholder",
  },
});
