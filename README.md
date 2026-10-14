# CAMPUS ROADMAP

### Your syllabus. Your topics. Your YouTube lectures.

A simple roadmap that takes students from their **college syllabus → exact unit → topic → curated YouTube lecture/playlist**.

[ Live ](https://campus-roadmap-alpha.vercel.app/)

</div>

---

## 🎯 What is Campus Roadmap?

Students often waste time searching YouTube for lectures that actually match their college syllabus.

**Campus Roadmap removes that search work.**

Choose your year → choose your subject → open a unit → pick a topic → jump straight to YouTube.

---

## ✨ Features

| Feature | What it does |
|---|---|
| 📚 Syllabus Roadmap | Organizes subjects, units and topics in one clear structure |
| ▶️ YouTube Lectures | Opens curated videos and playlists directly on YouTube |
| 🔎 Search | Find topics quickly across the roadmap |
| 📝 Community Notes | Students can submit PDF notes for a subject/unit |
| ✅ Admin Review | Notes stay pending until an admin approves them |
| 🔐 Private Storage | Notes are stored in a private Supabase Storage bucket |
| 🗑️ Admin Delete | Admin can permanently remove a submission and its PDF |

---

## 🧭 How it works

```text
Choose Year
   ↓
Choose Subject
   ↓
Open Unit
   ↓
Pick Topic
   ↓
Watch on YouTube
```

### Community Notes

```text
Student uploads PDF
        ↓
      Pending
        ↓
   Admin reviews
     ↙     ↘
 Approve   Delete
    ↓         ↓
Published   Removed
```

---

## 🛠️ Tech Stack

**Frontend:** Next.js, React, TypeScript, CSS

**Backend:** Next.js Route Handlers + Supabase

**Storage:** Supabase Storage

**Deployment:** Vercel

**Database:** Supabase PostgreSQL

---

## 🔐 Security

- Public users can submit notes, but submissions start as **pending**.
- Direct anonymous Storage uploads are blocked.
- PDF uploads go through a **server-side Next.js route**.
- Admin actions are protected by authentication and an admin user check.
- PDFs stay in a **private bucket** and are accessed through short-lived signed URLs.
- `.env.local` is excluded from Git.

---

## 🚀 Run locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## 💡 Why it exists

**Less searching. Less confusion. More studying.**

Campus Roadmap is built to make syllabus-based exam preparation faster and more focused.

---

<div align="center">

### Made for students who just want to study, not search.

⭐ Star the repo if you find it useful.

</div>
