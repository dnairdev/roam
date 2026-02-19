import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId;
  const { searchParams } = new URL(req.url);
  const bucketId = searchParams.get("bucketId");
  const search = searchParams.get("q");

  const where: any = { userId };
  if (bucketId) where.bucketId = bucketId;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { notes: { contains: search } },
      { location: { contains: search } },
    ];
  }

  const ideas = await prisma.idea.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(ideas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId;
  const body = await req.json();

  const idea = await prisma.idea.create({
    data: {
      title: body.title || "Untitled idea",
      notes: body.notes || "",
      location: body.location || "",
      tags: body.tags || "[]",
      planType: body.planType || "solo",
      savedLink: body.savedLink || "",
      bucketId: body.bucketId || null,
      userId,
    },
  });

  return NextResponse.json(idea, { status: 201 });
}
