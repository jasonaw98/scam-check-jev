import { type NextRequest, NextResponse } from "next/server";
import { checkScam } from "@/lib/scam-check";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message?.trim();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: 'Please provide a "message" string' },
        { status: 400 },
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "Message too long (max ~4000 chars for MVP)" },
        { status: 400 },
      );
    }

    const result = await checkScam(message);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "We couldn't read that message. Try again in a moment." },
      { status: 500 },
    );
  }
}
