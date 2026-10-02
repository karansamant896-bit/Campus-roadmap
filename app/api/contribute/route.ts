import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CAMPUS_SYLLABUS } from "../../../lib/syllabus";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? "";

const MAX_FILE_SIZE = 6 * 1024 * 1024;

function adminClient() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error("Server Supabase environment variables are missing.");
  }

  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 80);
}

function getSubjects() {
  return Object.values(CAMPUS_SYLLABUS);
}

function isValidSubjectUnit(subject: string, unit: string) {
  return getSubjects().some(
    (item) =>
      item.name === subject &&
      item.units.some((candidate) => candidate.title === unit),
  );
}

export async function POST(request: Request) {
  let uploadedPath = "";

  try {
    const form = await request.formData();

    const name = String(form.get("name") ?? "").trim();
    const course = String(form.get("course") ?? "").trim();
    const year = String(form.get("year") ?? "").trim();
    const batch = String(form.get("batch") ?? "").trim();
    const subject = String(form.get("subject") ?? "").trim();
    const unit = String(form.get("unit") ?? "").trim();
    const file = form.get("file");

    if (!name || !course || !year || !batch || !subject || !unit) {
      return NextResponse.json(
        { error: "Please fill every field." },
        { status: 400 },
      );
    }

    if (name.length > 80 || course.length > 80 || batch.length > 20) {
      return NextResponse.json(
        { error: "One or more fields are too long." },
        { status: 400 },
      );
    }

    if (
      year !== "1st Year" &&
      year !== "2nd Year" &&
      year !== "3rd Year" &&
      year !== "4th Year"
    ) {
      return NextResponse.json(
        { error: "Invalid year selected." },
        { status: 400 },
      );
    }

    if (!isValidSubjectUnit(subject, unit)) {
      return NextResponse.json(
        { error: "Invalid subject or unit." },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please choose a PDF file." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be 6 MB or smaller." },
        { status: 400 },
      );
    }

    const filename = file.name.trim();

    if (!filename.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are allowed." },
        { status: 400 },
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed." },
        { status: 400 },
      );
    }

    const firstBytes = new Uint8Array(
      await file.slice(0, 5).arrayBuffer(),
    );

    const pdfHeader = new TextDecoder().decode(firstBytes);

    if (pdfHeader !== "%PDF-") {
      return NextResponse.json(
        { error: "The uploaded file is not a valid PDF." },
        { status: 400 },
      );
    }

    const safeName = slugify(name) || "student";
    const safeSubject = slugify(subject) || "subject";
    const safeFile = slugify(filename.replace(/\.pdf$/i, "")) || "notes";

    uploadedPath = `${safeName}/${safeSubject}/${Date.now()}-${crypto.randomUUID()}-${safeFile}.pdf`;

    const client = adminClient();

    const { error: uploadError } = await client.storage
      .from("notes")
      .upload(uploadedPath, file, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message || "The PDF could not be uploaded.");
    }

    const { error: insertError } = await client
      .from("contributions")
      .insert({
        name,
        course,
        year,
        batch,
        subject,
        unit,
        file_name: filename,
        file_path: uploadedPath,
        status: "pending",
      });

    if (insertError) {
      await client.storage.from("notes").remove([uploadedPath]);
      throw new Error(
        insertError.message || "Your submission details could not be saved.",
      );
    }

    return NextResponse.json({
      success: true,
      message: "Submitted successfully. Your notes are pending review.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}