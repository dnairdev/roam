import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId;
  const body = await req.json();

  const bucket = await prisma.bucket.updateMany({
    where: { id: params.id, userId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.emoji !== undefined && { emoji: body.emoji }),
      ...(body.order !== undefined && { order: body.order }),
    },
  });

  if (bucket.count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.bucket.findUnique({
    where: { id: params.id },
    include: { _count: { select: { ideas: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId;

  // Unlink ideas first, then delete bucket
  await prisma.idea.updateMany({
    where: { bucketId: params.id, userId },
    data: { bucketId: null },
  });

  const result = await prisma.bucket.deleteMany({
    where: { id: params.id, userId },
  });

  if (result.count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
