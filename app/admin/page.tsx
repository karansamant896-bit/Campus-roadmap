import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { createSupabaseAdminClient } from "../../lib/supabase/admin";
import NoteActions from "./actions";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error: authError } = await supabase.auth.getClaims();

  if (authError || !data?.claims?.sub) {
    redirect("/admin/login");
  }

  if (data.claims.sub !== process.env.ADMIN_USER_ID) {
    redirect("/admin/login");
  }

  const admin = createSupabaseAdminClient();

  const { data: contributions, error: contributionsError } = await admin
    .from("contributions")
    .select(
      "id, name, course, year, batch, subject, unit, file_name, status, created_at",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "#06141b",
        color: "#fff",
      }}
    >
      <h1>Admin Dashboard</h1>

      <p style={{ opacity: 0.7 }}>
        Pending note submissions: {contributions?.length ?? 0}
      </p>

      {contributionsError && (
        <p style={{ color: "#ff8d8d" }}>
          Could not load submissions.
        </p>
      )}

      {!contributionsError && contributions?.length === 0 && (
        <p style={{ opacity: 0.7 }}>
          No pending submissions.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gap: "16px",
          marginTop: "24px",
          maxWidth: "900px",
        }}
      >
        {contributions?.map((item) => (
          <article
            key={item.id}
            style={{
              padding: "20px",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: "16px",
              background: "rgba(255,255,255,.05)",
            }}
          >
            <strong>{item.file_name}</strong>

            <p>
              {item.name} · {item.year} · {item.course}
            </p>

            <p>
              {item.subject} · {item.unit ?? "Unit not specified"}
            </p>

            <small style={{ opacity: 0.6 }}>
              {item.created_at}
            </small>

            <div style={{ marginTop: "16px" }}>
              <a
                href={`/api/admin/notes/view?id=${encodeURIComponent(item.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#173b34",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                View PDF ↗
              </a>
            </div>
            <NoteActions noteId={item.id} />
          </article>
        ))}
      </div>
    </main>
  );
}