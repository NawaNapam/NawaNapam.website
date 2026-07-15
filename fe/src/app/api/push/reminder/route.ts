// app/api/push/reminder/route.ts
// Meant to be hit by an external scheduler (Vercel Cron, cron-job.org, etc.),
// not by the app or `be`. Nudges users who have the app installed (have a
// push token) but haven't been active recently, similar to Flipkart/Zomato's
// "come back" notifications. Safe to call repeatedly — it only ever targets
// users who look inactive at call time, no state of its own to get stuck.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push/sendPush";

const MESSAGES = [
  { title: "Someone's waiting to talk 👋", body: "Jump back into NawaNapam and meet someone new right now." },
  { title: "It's quiet without you", body: "A few people are online now — start a random video chat." },
  { title: "Keep your streak alive 🔥", body: "You haven't checked in today. One quick chat keeps it going." },
];

function requireReminderSecret(req: NextRequest): boolean {
  const secret =
    req.headers.get("x-shared-secret") ?? req.nextUrl.searchParams.get("secret");
  return Boolean(secret) && secret === (process.env.PUSH_REMINDER_SECRET || "change_me_now");
}

export async function POST(req: NextRequest) {
  if (!requireReminderSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hoursInactive = Number(req.nextUrl.searchParams.get("hoursInactive") ?? 24);
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 500), 2000);
  const cutoff = new Date(Date.now() - hoursInactive * 60 * 60 * 1000);

  const candidates = await prisma.user.findMany({
    where: {
      banned: false,
      pushTokens: { some: {} },
      OR: [{ lastActiveDate: null }, { lastActiveDate: { lt: cutoff } }],
    },
    select: { id: true },
    take: limit,
  });

  const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  let sent = 0;
  for (const user of candidates) {
    const count = await sendPushToUser(user.id, {
      title: message.title,
      body: message.body,
      data: { type: "reminder" },
    });
    if (count > 0) sent++;
  }

  return NextResponse.json({ ok: true, targeted: candidates.length, sent });
}
