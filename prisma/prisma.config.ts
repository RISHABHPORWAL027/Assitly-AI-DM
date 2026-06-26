import * as dotenv from 'dotenv';
import { defineConfig } from '@prisma/client/runtime';

dotenv.config();

export default defineConfig({
  datasource: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
});
