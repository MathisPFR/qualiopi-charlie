"use server";

import {
  formTypeFromRoute,
  processFormSubmission,
} from "@/server/workflows/form-response";

export async function submitPublicForm(
  slug: string,
  formTypeRoute: string,
  responses: Record<string, string>,
  stagiaireId?: string
) {
  const type = formTypeFromRoute(formTypeRoute);
  if (!type) throw new Error("Type de formulaire invalide");
  return processFormSubmission(slug, type, responses, stagiaireId);
}
