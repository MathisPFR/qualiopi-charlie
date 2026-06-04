import { NextRequest, NextResponse } from "next/server";
import { runEvalFroidCron } from "@/server/workflows/eval-froid";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await runEvalFroidCron();
  return NextResponse.json({ ok: true, results });
}
