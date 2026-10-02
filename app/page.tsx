"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CAMPUS_SYLLABUS } from "../lib/syllabus";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

const subjectCards = [
  {
    key: "physics" as const,
    index: "01",
    mini: "5 UNITS",
    title: <>Engineering<br />Physics</>,
    description: "Wave optics, polarization, lasers, relativity, quantum mechanics & nanophysics.",
  },
  {
    key: "math" as const,
    index: "02",
    mini: "5 UNITS",
    title: <>Engineering<br />Mathematics - 1</>,
    description: "Matrices, differential calculus, multiple integrals & vector calculus.",
  },
  {
    key: "electrical" as const,
    index: "03",
    mini: "5 UNITS",
    title: <>Basic Electrical<br />Engineering</>,
    description: "DC circuits, single-phase AC, installations & energy sources.",
  },
  {
    key: "c" as const,
    index: "04",
    mini: "COURSE ADDED",
    title: <>Programming<br />in C</>,
    description: "CodeWithHarry course link added for C programming practice.",
  },
];

type SubjectKey = keyof typeof CAMPUS_SYLLABUS;
type Note = {
  id: string;
  subject: string;
  unit: string | null;
  file_name: string;
  file_path: string;
  contributor_name: string;
  year: string | null;
  approved_at: string | null;
};

type ModalName = "search" | "chai" | "contribute" | null;

function makeSupabaseClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase environment variables are missing.");
  }
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

function slugifyFilePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 80);
}

function getGeneratedPath(file: File, name: string, subject: string) {
  const base = slugifyFilePart(file.name.replace(/\.pdf$/i, "")) || "notes";
  const who = slugifyFilePart(name) || "student";
  const topic = slugifyFilePart(subject) || "subject";
  const uid = crypto.randomUUID();
  return `${who}/${topic}/${Date.now()}-${uid}-${base}.pdf`;
}

function validatePdf(file: File | null) {
  if (!file) return "Please choose a PDF file.";
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Only PDF files are allowed.";
  if (file.size > 6 * 1024 * 1024) return "File must be 6 MB or smaller.";
  return "";
}

export default function HomePage() {
  const [activeSubject, setActiveSubject] = useState<SubjectKey>("physics");
  const [openUnits, setOpenUnits] = useState<Record<string, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [modal, setModal] = useState<ModalName>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [publishedNotes, setPublishedNotes] = useState<Note[]>([]);
  const [toast, setToast] = useState("");

  const [name, setName] = useState("");
  const [course, setCourse] = useState("B.Tech CSE");
  const [year, setYear] = useState("");
  const [batch, setBatch] = useState("");
  const [contributionSubject, setContributionSubject] = useState("");
  const [contributionUnit, setContributionUnit] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contributionStatus, setContributionStatus] = useState("");
  const [contributionStatusType, setContributionStatusType] = useState<"" | "error" | "success">("");
  const [submitting, setSubmitting] = useState(false);


type RoadmapTopic = readonly [string, string, string | null];

type RoadmapUnit = {
  title: string;
  topics: RoadmapTopic[];
};

type RoadmapSubject = {
  name: string;
  code: string;
  units: RoadmapUnit[];
};

type Roadmap = Record<string, RoadmapSubject>;

const roadmap = useMemo<Roadmap>(() => {
  const result: Roadmap = {};

  Object.entries(CAMPUS_SYLLABUS).forEach(([key, subjectData]) => {
    result[key] = {
      name: subjectData.name,
      code: subjectData.code,
      units: subjectData.units.map((unit) => ({
        title: unit.title,
       topics:
  "curatedVideos" in unit && unit.curatedVideos?.length
    ? unit.curatedVideos.map(
        ([topic, creator, url]): RoadmapTopic => [
          topic,
          creator,
          url ?? null,
        ],
      )
    : unit.topics.map((topic): RoadmapTopic => {
        if (key === "c") {
          return [
            topic,
            "CodeWithHarry",
            "https://youtu.be/aZb0iu4uGwA?si=ojoRWToI3uGCXr26",
          ];
        }

        return [topic, "YouTube link pending", null];
      }),
      })),
    };
  });

  return result;
}, []);
  const subject = roadmap[activeSubject] ?? roadmap.physics;

  const allTopics = useMemo(() => {
    return Object.values(roadmap).flatMap((item) =>
      item.units.flatMap((unit) =>
        unit.topics.map(([topic, creator, url]) => ({ topic, creator, url, subject: item.name, unit: unit.title })),
      ),
    );
  }, [roadmap]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const found = (q
      ? allTopics.filter((item) => `${item.topic} ${item.creator} ${item.subject} ${item.unit}`.toLowerCase().includes(q))
      : allTopics.slice(0, 6)
    ).slice(0, 8);
    return found;
  }, [allTopics, searchQuery]);

  useEffect(() => {
    let cancelled = false;
    async function loadNotes() {
      try {
        const client = makeSupabaseClient();
        const { data, error } = await client
          .from("published_notes")
          .select("id,subject,unit,file_name,file_path,contributor_name,year,approved_at")
          .order("approved_at", { ascending: false });
        if (!cancelled) {
          setPublishedNotes(error ? [] : ((data ?? []) as Note[]));
        }
      } catch {
        if (!cancelled) setPublishedNotes([]);
      }
    }
    loadNotes();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setOpenUnits((prev) => {
      const next = { ...prev };
      subject.units.forEach((unit) => {
        const key = `${activeSubject}:${unit.title}`;
        if (!(key in next)) next[key] = false;
      });
      return next;
    });
  }, [activeSubject, subject.units]);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("section[id]"));
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const noteForUnit = (unitTitle: string) => {
    return publishedNotes.filter(
      (note) =>
        note.subject.trim().toLowerCase() === subject.name.trim().toLowerCase() &&
        (note.unit ?? "").trim().toLowerCase() === unitTitle.trim().toLowerCase(),
    );
  };

  const selectSubject = (key: SubjectKey) => {
    setActiveSubject(key);
    document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const closeModal = () => {
    setModal(null);
    setMobileMenuOpen(false);
  };

  const showToast = (message: string) => setToast(message);

  const handleSubmitContribution = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fileError = validatePdf(selectedFile);
    if (fileError) {
      setContributionStatusType("error");
      setContributionStatus(fileError);
      return;
    }

    if (!name.trim() || !course.trim() || !year || !batch.trim() || !contributionSubject || !contributionUnit) {
      setContributionStatusType("error");
      setContributionStatus("Please fill every field.");
      return;
    }

    setSubmitting(true);
    setContributionStatusType("");
    setContributionStatus("Uploading your notes…");

   try {
  const formData = new FormData();

  formData.append("name", name.trim());
  formData.append("course", course.trim());
  formData.append("year", year);
  formData.append("batch", batch.trim());
  formData.append("subject", contributionSubject);
  formData.append("unit", contributionUnit);
  formData.append("file", selectedFile!);

  const response = await fetch("/api/contribute", {
    method: "POST",
    body: formData,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.error || "Your submission could not be completed.",
    );
  }      setContributionStatusType("success");
      setContributionStatus("Submitted successfully. Your notes are pending review.");

      setName("");
      setCourse("B.Tech CSE");
      setYear("");
      setBatch("");
      setContributionSubject("");
      setContributionUnit("");
      setSelectedFile(null);

      window.setTimeout(() => {
        setModal(null);
        setContributionStatus("");
        setContributionStatusType("");
      }, 1800);
    } catch (error) {
      setContributionStatusType("error");
      setContributionStatus(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
      <div className="video-bg" aria-hidden="true">
        <video autoPlay muted loop playsInline preload="auto">
          <source src="/assets/background.mp4" type="video/mp4" />
        </video>
        <div className="video-tint" />
        <div className="video-vignette" />
      </div>
      <div className="grain" aria-hidden="true" />

      <header className="topbar" id="topbar">
        <a className="brand" href="#home" aria-label="Campus Roadmap home">
          <span className="brand-symbol">C</span>
          <span className="brand-name"><strong>CAMPU<span>S</span></strong><small>ROADMAP</small></span>
        </a>
        <nav className={`nav ${mobileMenuOpen ? "mobile-open" : ""}`}>
          {[
            ["home", "Home"],
            ["years", "Explore"],
            ["roadmap", "Roadmap"],
            ["how", "How it works"],
            ["contact", "Contact"],
          ].map(([id, label]) => (
            <a key={id} className={activeSection === id ? "active" : ""} href={`#${id}`} onClick={() => setMobileMenuOpen(false)}>{label}</a>
          ))}
          <button className="nav-search" type="button" onClick={() => setModal("search")}>Search ⌕</button>
        </nav>
        <button className="mobile-toggle" type="button" aria-label="Open menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
          <span /><span />
        </button>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="pill"><i /> SYLLABUS • TOPICS • YOUTUBE</div>
            <h1>Clarity in<br /><em>syllabus</em><br />Mastery in<br /><em>preparation</em></h1>
            <div className="hero-rule" />
            <p>Follow the Graphic Era BTech CSE syllabus, find the exact topic, and jump straight to a curated YouTube lecture. No playlist hunting. No login. Just study.</p>
            <div className="hero-actions">
              <a className="hero-btn glass" href="#years">Explore <span>→</span></a>
              <a className="hero-btn glass" href="#how"><span className="play">▷</span> How it works</a>
            </div>
          </div>
        </section>

        <section className="section panel-light" id="years">
          <div className="section-inner">
            <div className="section-head">
              <div><div className="eyebrow">START HERE</div><h2>Choose your <em>year.</em></h2></div>
              <p>One visual system, one clear path — from your year to the exact lecture you need.</p>
            </div>
            <div className="year-grid">
              <button className="glass-card year active" type="button" onClick={() => document.getElementById("subjectSection")?.scrollIntoView({ behavior: "smooth" })}>
                <span className="index">01</span><span className="badge live">ACTIVE</span>
                <div className="card-bottom"><h3>1st Year</h3><p>Physics · Maths · Electrical · C*</p><span className="arrow">↗</span></div>
              </button>
              {["2nd Year", "3rd Year", "4th Year"].map((item, index) => (
                <div className="glass-card year muted" key={item}><span className="index">0{index + 2}</span><span className="badge">COMING SOON</span><div className="card-bottom"><h3>{item}</h3><p>More subjects are on the way.</p></div></div>
              ))}
            </div>
          </div>
        </section>

        <section className="section panel-dark" id="subjectSection">
          <div className="section-inner">
            <div className="section-head on-dark">
              <div><div className="eyebrow">1ST YEAR · SEMESTER 1</div><h2>Pick a <em>subject.</em></h2></div>
              <button className="outline-btn" type="button" onClick={() => document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth" })}>Open roadmap ↘</button>
            </div>
            <div className="subject-grid">
              {subjectCards.map((card) => (
                <button key={card.key} className={`subject-card ${activeSubject === card.key ? "active" : ""}`} type="button" onClick={() => selectSubject(card.key)}>
                  <span className="index">{card.index}</span><span className="mini">{card.mini}</span>
                  <div className="subject-copy"><h3>{card.title}</h3><p>{card.description}</p></div>
                  <span className="card-arrow">↗</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section panel-light" id="roadmap">
          <div className="section-inner">
            <div className="section-head">
              <div><div className="eyebrow">DRILL DOWN</div><h2>Unit to <em>topic.</em></h2></div>
              <div className="selected"><span>VIEWING</span><strong>{subject.name}</strong></div>
            </div>

            <div className="roadmap-wrap">
              <div className="units">
                {subject.units.map((unit, index) => {
                  const unitKey = `${activeSubject}:${unit.title}`;
                  const isOpen = openUnits[unitKey] ?? index === 0;
                  const notes = noteForUnit(unit.title);
                  return (
                    <article className={`unit ${isOpen ? "open" : ""}`} key={unit.title}>
                      <button className="unit-head" type="button" onClick={() => setOpenUnits((prev) => ({ ...prev, [unitKey]: !isOpen }))}>
                        <span className="unit-num">UNIT {String(index + 1).padStart(2, "0")}</span>
                        <span className="unit-title">{unit.title}</span>
                        <span className="unit-plus">+</span>
                      </button>
                      <div className="topic-wrap"><div className="topic-inner">
                       {unit.topics.map(([topic, creator, url], topicIndex) => (
                          <div className="topic" key={`${unit.title}:${topic}:${topicIndex}`}>
                            <div className="topic-main"><small>{creator === "Curated YouTube Lecture" || creator === "YouTube Playlist" ? "CURATED LECTURE" : "SYLLABUS TOPIC"}</small><strong>{topic}</strong></div>
                            <span className="creator">{creator}</span>
                            {url ? <a className="watch" href={url} target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a> : <button className="watch pending-watch" type="button" disabled>YouTube link pending</button>}
                          </div>
                        ))}
                        {notes.length > 0 && (
                          <div className="community-notes">
                            <div className="community-notes-head"><small>COMMUNITY NOTES</small><small>{notes.length} {notes.length === 1 ? "NOTE" : "NOTES"}</small></div>
                            <div className="community-notes-list">
                              {notes.map((note) => (
                                <article className="community-note" key={note.id}>
                                  <div className="community-note-copy"><strong>{note.file_name}</strong><span>Notes by {note.contributor_name}{note.year ? ` · ${note.year}` : ""}</span></div>
                                  <button className="view-note" type="button" onClick={async () => {
                                    try {
                                      const client = makeSupabaseClient();
                                      const { data, error } = await client.storage.from("notes").createSignedUrl(note.file_path, 300);
                                      if (error || !data?.signedUrl) throw new Error(error?.message || "Unable to open this note.");
                                      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
                                    } catch (error) {
                                      showToast(error instanceof Error ? error.message : "Unable to open this note.");
                                    }
                                  }}>View Notes ↗</button>
                                </article>
                              ))}
                            </div>
                          </div>
                        )}
                      </div></div>
                    </article>
                  );
                })}
              </div>
              <aside className="side-note"><span className="note-line" /><div><div className="eyebrow">ONE CLICK, NO FRICTION</div><h3>Go straight to the lecture</h3><p>Each Watch on YouTube action opens the creator&apos;s original video page in a new tab.</p></div></aside>
            </div>
          </div>
        </section>

        <section className="section panel-dark" id="how">
          <div className="section-inner">
            <div className="section-head on-dark"><div><div className="eyebrow">THE FLOW</div><h2>Search less.<br /><em>Study more.</em></h2></div></div>
            <div className="flow-grid">
              <article><span>01</span><h3>Choose your year</h3><p>Start from the same academic structure you already know.</p></article>
              <article><span>02</span><h3>Open your subject</h3><p>See clean, focused cards instead of a wall of links.</p></article>
              <article><span>03</span><h3>Expand a unit</h3><p>Reveal only the topics you need right now.</p></article>
              <article><span>04</span><h3>Watch on YouTube</h3><p>Leave the portal and learn on the creator&apos;s original video page.</p></article>
            </div>
          </div>
        </section>

        <section className="section panel-light contact" id="contact">
          <div className="contact-inner"><div><div className="eyebrow">CAMPUS ROADMAP</div><h2>Your semester,<br /><em>already mapped.</em></h2></div></div>
        </section>
      </main>

      <div className="floating-actions">
        <button className="contribute-fab" type="button" onClick={() => setModal("contribute")}>✎ Contribute Notes</button>
        <button className="chai-fab" type="button" onClick={() => setModal("chai")}>☕ Buy Me a Chai</button>
      </div>

      <footer className="footer"><div><strong>Campus Roadmap</strong><span>© 2026</span></div><div><span>Public YouTube links only · No media hosted</span></div></footer>

      {modal === "search" && (
        <div className="modal open" aria-hidden="false">
          <div className="backdrop" onClick={closeModal} />
          <div className="dialog search-dialog">
            <button className="close" type="button" onClick={closeModal} aria-label="Close">×</button>
            <div className="eyebrow">SEARCH ROADMAP</div><h2>What are you studying?</h2>
            <div className="searchbox"><span>⌕</span><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={'Try “Newton\'s Rings” or “C pointers”...'} autoFocus /></div>
            <div className="results">
              {searchResults.length ? searchResults.map((item) => (
                <a className="result" key={`${item.subject}:${item.unit}:${item.topic}`} href={item.url ?? "#roadmap"} target={item.url ? "_blank" : undefined} rel={item.url ? "noopener noreferrer" : undefined} onClick={() => !item.url && closeModal()}>
                  <div><small>{item.subject} · {item.unit}</small><strong>{item.topic}</strong></div><span>{item.creator} ↗</span>
                </a>
              )) : <div className="result"><div><strong>No topic found.</strong><small>Try another phrase.</small></div></div>}
            </div>
          </div>
        </div>
      )}

      {modal === "contribute" && (
        <div className="modal open" aria-hidden="false">
          <div className="backdrop" onClick={closeModal} />
          <div className="dialog contribution-dialog">
            <button className="close" type="button" onClick={closeModal} aria-label="Close">×</button>
            <div className="contribute-header"><div className="chai-icon">✎</div><div className="eyebrow">SHARE YOUR NOTES</div><h2>Contribute Notes</h2><p>Help other students by sharing useful notes or corrections.</p></div>
            <form className="contribution-form" onSubmit={handleSubmitContribution}>
              <div className="form-grid">
                <label className="form-field"><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} type="text" placeholder="Your name" maxLength={80} required /></label>
                <label className="form-field"><span>Course</span><input value={course} onChange={(event) => setCourse(event.target.value)} type="text" maxLength={80} required /></label>
                <label className="form-field"><span>Year</span><select value={year} onChange={(event) => setYear(event.target.value)} required><option value="" disabled>Select year</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option></select></label>
                <label className="form-field"><span>Batch</span><input value={batch} onChange={(event) => setBatch(event.target.value)} type="text" placeholder="e.g. 2026" maxLength={20} required /></label>
                <label className="form-field"><span>Subject</span><select value={contributionSubject} onChange={(event) => { setContributionSubject(event.target.value); setContributionUnit(""); }} required><option value="" disabled>Select subject</option>{Object.entries(CAMPUS_SYLLABUS).map(([key, value]) => <option key={key} value={value.name}>{value.name}</option>)}</select></label>
                <label className="form-field"><span>Unit / Chapter</span><select value={contributionUnit} onChange={(event) => setContributionUnit(event.target.value)} disabled={!contributionSubject} required><option value="" disabled>Select unit</option>{contributionSubject && Object.values(CAMPUS_SYLLABUS).find((item) => item.name === contributionSubject)?.units.map((unit) => <option key={unit.title} value={unit.title}>{unit.title}</option>)}</select></label>
                <label className="form-field full"><span>Upload PDF <b>*</b></span><input type="file" accept="application/pdf,.pdf" required onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} /><small>PDF only · Maximum 6 MB</small></label>
              </div>
              <div className="file-summary"><div><small>Filename (auto-generated)</small><strong>{selectedFile?.name ?? "No file selected"}</strong></div><span>PDF</span></div>
              <div className={`contribution-status ${contributionStatusType}`} role="status" aria-live="polite">{contributionStatus}</div>
              <button className="hero-btn contribution-action" type="submit" disabled={submitting}>{submitting ? "Uploading…" : "Upload Notes"} <span>↗</span></button>
            </form>
          </div>
        </div>
      )}

      {modal === "chai" && (
        <div className="modal open" aria-hidden="false">
          <div className="backdrop" onClick={closeModal} />
          <div className="dialog chai-dialog">
            <button className="close" type="button" onClick={closeModal} aria-label="Close">×</button>
            <div className="chai-icon">☕</div><div className="eyebrow">SUPPORT THE PROJECT</div><h2>Buy me a chai.</h2><p>Scan the QR or copy the UPI ID to support the project.</p>
            <div className="upi"><div><small>UPI ID</small><strong>6260157821@fam</strong></div><button type="button" onClick={async () => { try { await navigator.clipboard.writeText("6260157821@fam"); } catch {} showToast("UPI ID copied"); }}>Copy</button></div>
            <div className="qr"><img src="/assets/upi-qr.jpeg" alt="UPI payment QR code" /></div>
          </div>
        </div>
      )}

      {toast && <div className="toast show">{toast}</div>}
    </>
  );
}
