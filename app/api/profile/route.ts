import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBaseUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8001";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const res = await fetch(`${backendBaseUrl}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    const text = await res.text();
    if (!res.ok) return new NextResponse(text, { status: res.status });
    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e), to: backendBaseUrl },
      { status: 500 }
    );
  }
}
