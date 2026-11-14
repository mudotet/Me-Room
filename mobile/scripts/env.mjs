import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Read only the API address; never return or print the rest of the environment. */
export function readApiAddress() {
  const envPath = fileURLToPath(new URL('../.env', import.meta.url));
  if (existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
    } catch {
      throw new Error('ENV_UNREADABLE');
    }
  }
  const value = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
  if (!value?.trim()) throw new Error('API_ADDRESS_MISSING');
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('API_ADDRESS_INVALID');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('API_ADDRESS_INVALID');
  }
  return url.toString().replace(/\/+$/, '');
}
