import { NextResponse } from "next/server";

import { parseFeedbackSubmission } from "@/lib/server/feedback-validation";
import { clientAddress, hitRateLimit } from "@/lib/server/rate-limit";
import { supabaseAdminRest } from "@/lib/server/supabase-admin";

export async function POST(request: Request) {
  if (hitRateLimit(`feedback:${clientAddress(request)}`, 8, 60_000)) {
    return NextResponse.json(
      { success: false, error: "Please wait a moment before sending another note." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid feedback." }, { status: 400 });
  }

  const parsed = parseFeedbackSubmission(body);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  const result = await supabaseAdminRest("feedbacks", {
    method: "POST",
    body: parsed.value,
    prefer: "return=minimal",
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: "We could not save your feedback. Please try again." },
      { status: result.status >= 500 ? 502 : 400 },
    );
  }

  return NextResponse.json({ success: true });
}
