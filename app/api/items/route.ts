import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    { message: "Items list endpoint is not implemented yet." },
    { status: 501 },
  );
}

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { message: "Creating items is not implemented yet." },
    { status: 501 },
  );
}
