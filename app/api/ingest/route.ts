import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBaseUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8001";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const forward = new FormData();
    forward.append("file", file as Blob);

    const res = await fetch(`${backendBaseUrl}/ingest`, {
      method: "POST",
      body: forward,
      // avoid caching/proxying
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
