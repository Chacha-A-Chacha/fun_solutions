import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Connection is handled by the MariaDB adapter at runtime.
    // This placeholder satisfies prisma generate without needing env vars.
    url: "mysql://root@localhost:3306/placeholder",
  },
});
