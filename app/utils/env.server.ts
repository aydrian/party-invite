import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().nonempty(),
  PARTY_ID: z.string().nonempty(),
  SESSION_SECRET: z.string().nonempty()
});

const env = envSchema.parse(process.env);
export default env;
