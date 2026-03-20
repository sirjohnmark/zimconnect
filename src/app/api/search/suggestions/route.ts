import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q.length < 2) {
    return NextResponse.json({ error: "Query too short" }, { status: 400 });
  }
  if (q.length > 100) {
    return NextResponse.json({ error: "Query too long" }, { status: 400 });
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("search_suggestions", {
    query_text: q,
  });

  if (error) {
    console.error("[/api/search/suggestions]", error.message);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data ?? [], {
    status: 200,
    headers: { "Cache-Control": "public, max-age=30" },
  });
}
