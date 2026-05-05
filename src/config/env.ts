import Constants from 'expo-constants';
import { z } from 'zod';

const schema = z.object({
  apiUrl: z.string().url(),
});

const parsed = schema.safeParse(Constants.expoConfig?.extra);

if (!parsed.success) {
  throw new Error(
    `Invalid env config (Constants.expoConfig.extra): ${parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')}`,
  );
}

export const env = parsed.data;
