import Constants from 'expo-constants';
import { z } from 'zod';

const appEnv = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.appEnv;
const isProduction = appEnv === 'production';

const schema = z.object({
  apiUrl: isProduction
    ? z.string().url().refine((u) => u.startsWith('https://'), {
        message: 'apiUrl must use HTTPS in production',
      })
    : z.string().url(),
  appEnv: z.string().default('development'),
});

const parsed = schema.safeParse(Constants.expoConfig?.extra);

if (!parsed.success) {
  throw new Error(
    `Invalid env config: ${parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')}`,
  );
}

export const env = parsed.data;
