import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserBusyBlocks } from "@/lib/calendar";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId as string;
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  const accessToken = account?.access_token;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Calendar not connected", blocks: [] },
      { status: 200 }
    );
  }

  try {
    const blocks = await getUserBusyBlocks(accessToken);
    return NextResponse.json({ blocks });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch calendar", blocks: [] },
      { status: 200 }
    );
  }
}
