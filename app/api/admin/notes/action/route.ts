import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";
import { createSupabaseAdminClient } from "../../../../../lib/supabase/admin";

type Action = "approve" | "delete";

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => null);

  const noteId = typeof body?.id === "string" ? body.id : "";
  const action: Action | "" =
    body?.action === "approve" || body?.action === "delete"
      ? body.action
      : "";

  if (!noteId || !action) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();

  const { data: contribution, error: findError } = await admin
    .from("contributions")
    .select("id, file_path, status")
    .eq("id", noteId)
    .single();

  if (findError || !contribution) {
    return NextResponse.json(
      { error: "Note not found." },
      { status: 404 },
    );
  }

  if (action === "approve") {
    const { error } = await admin
      .from("contributions")
      .update({ status: "approved" })
      .eq("id", noteId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Note approved.",
    });
  }

  const { error: storageError } = await admin.storage
    .from("notes")
    .remove([contribution.file_path]);

  if (storageError) {
    return NextResponse.json(
      { error: "Could not delete the PDF from storage." },
      { status: 500 },
    );
  }

  const { error: deleteError } = await admin
    .from("contributions")
    .delete()
    .eq("id", noteId);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Note permanently deleted.",
  });
}