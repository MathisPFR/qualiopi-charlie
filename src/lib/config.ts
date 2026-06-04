import fs from "fs";
import path from "path";

export type ClientConfig = {
  orgName: string;
  orgEmail: string;
  storagePrefix: string;
  formBaseUrl: string;
};

const defaultConfig: ClientConfig = {
  orgName: "Organisme de formation",
  orgEmail: "contact@example.com",
  storagePrefix: "formations",
  formBaseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

export function getClientConfig(): ClientConfig {
  const configPath = path.join(process.cwd(), "config", "client.json");
  if (!fs.existsSync(configPath)) return defaultConfig;
  return { ...defaultConfig, ...JSON.parse(fs.readFileSync(configPath, "utf-8")) };
}

export function getStorageRoot(): string {
  return path.join(process.cwd(), "storage");
}

export function getTemplatesRoot(): string {
  return path.join(process.cwd(), "templates");
}
