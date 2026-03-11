import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  const digits = String(phone ?? "").replace(/\D/g, "");

  if (digits.length < 10) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  // Clean up old unused tokens for this number
  await prisma.otpToken.deleteMany({
    where: { phone: digits, used: false, expiresAt: { lt: new Date() } },
  });

  // Generate a 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.otpToken.create({ data: { phone: digits, code, expiresAt } });

  // ── Send SMS ───────────────────────────────────────────────
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To:   `+1${digits}`,
          From: TWILIO_PHONE_NUMBER,
          Body: `Your roam code is ${code}. Valid for 10 minutes.`,
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("Twilio error:", err);
      return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
    }
  } else {
    // Development fallback — return code in response for on-screen display
    console.log(`\n📱 OTP for +1${digits}: ${code}\n`);
    return NextResponse.json({ ok: true, devCode: code });
  }

  return NextResponse.json({ ok: true });
}
