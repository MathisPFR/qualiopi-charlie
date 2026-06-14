import { EmargementMode } from "@prisma/client";
import { getClientConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export type InstanceConfig = {
  orgName: string;
  orgEmail: string;
  formBaseUrl: string;
  storagePrefix: string;
  devisRequired: boolean;
  sendProgrammeOnLaunch: boolean;
  emargementModeDefault: EmargementMode;
};

const workflowDefaults = {
  devisRequired: true,
  sendProgrammeOnLaunch: false,
  emargementModeDefault: EmargementMode.PDF,
} as const;

export async function getInstanceConfig(): Promise<InstanceConfig> {
  const client = getClientConfig();
  const settings = await prisma.instanceSettings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings) {
    return {
      orgName: client.orgName,
      orgEmail: client.orgEmail,
      formBaseUrl: client.formBaseUrl,
      storagePrefix: client.storagePrefix,
      ...workflowDefaults,
    };
  }

  return {
    orgName: settings.orgName ?? client.orgName,
    orgEmail: settings.orgEmail ?? client.orgEmail,
    formBaseUrl: settings.formBaseUrl ?? client.formBaseUrl,
    storagePrefix: client.storagePrefix,
    devisRequired: settings.devisRequired,
    sendProgrammeOnLaunch: settings.sendProgrammeOnLaunch,
    emargementModeDefault: settings.emargementModeDefault,
  };
}
