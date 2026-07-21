import { env } from "$env/dynamic/private";
import { AppError } from "$lib/errors/AppError";

const requireEnv = (name: string): string => {
  const value = env[name];
  if (!value) {
    throw new AppError("Manglende konfigurasjon", `Miljøvariabelen ${name} er ikke satt`);
  }
  return value;
};

export const getMasseutsendelseApiBaseUrl = (): string => requireEnv("MASSEUTSENDELSE_API_BASE_URL");

export const getMatrikkelProxyClientId = (): string => requireEnv("MATRIKKELPROXY_CLIENT_ID");

export const getExcludedOwnerIds = (): string[] => (env.EXCLUDED_OWNER_IDS ? env.EXCLUDED_OWNER_IDS.split(",") : []);
