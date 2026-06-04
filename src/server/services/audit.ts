import {
  AutomationStatus,
  AutomationWorkflow,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function startRun(
  workflow: AutomationWorkflow,
  formationId?: string,
  payload?: Prisma.InputJsonValue
) {
  return prisma.automationRun.create({
    data: {
      workflow,
      formationId,
      status: AutomationStatus.RUNNING,
      payload: payload ?? undefined,
    },
  });
}

export async function finishRun(
  runId: string,
  status: AutomationStatus,
  message?: string
) {
  return prisma.automationRun.update({
    where: { id: runId },
    data: { status, message, finishedAt: new Date() },
  });
}
