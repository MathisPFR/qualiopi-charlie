import { NextResponse } from "next/server";
import { handleDocusealWebhook } from "@/server/workflows/signatures";

export async function POST(req: Request) {
  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header = req.headers.get("x-docuseal-secret");
    if (header !== secret) {
      return new NextResponse("Non autorisé", { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new NextResponse("JSON invalide", { status: 400 });
  }

  try {
    const result = await handleDocusealWebhook(
      payload as Parameters<typeof handleDocusealWebhook>[0]
    );
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[docuseal webhook]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
