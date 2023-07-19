import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().nonempty()
});

const env = envSchema.parse(process.env);
export default env;
