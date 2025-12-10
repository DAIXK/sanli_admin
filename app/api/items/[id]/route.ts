import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return NextResponse.json(
    { message: `Item ${id} endpoint is not implemented yet.` },
    { status: 501 },
  );
}
