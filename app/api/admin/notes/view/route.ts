import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";
import { createSupabaseAdminClient } from "../../../../../lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  const { data, error: authError } = await supabase.auth.getClaims();

  if (authError || !data?.claims?.sub) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (data.claims.sub !== process.env.ADMIN_USER_ID) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 },
    );
  }

  const noteId = new URL(request.url).searchParams.get("id");

  if (!noteId) {
    return NextResponse.json(
      { error: "Note ID is required." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();

  const { data: contribution, error: contributionError } = await admin
    .from("contributions")
    .select("id, file_path, file_name, status")
    .eq("id", noteId)
    .single();

  if (contributionError || !contribution) {
    return NextResponse.json(
      { error: "Note not found." },
      { status: 404 },
    );
  }

  const { data: signed, error: signedError } = await admin.storage
    .from("notes")
    .createSignedUrl(contribution.file_path, 300);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Could not create a secure file URL." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(signed.signedUrl);
}