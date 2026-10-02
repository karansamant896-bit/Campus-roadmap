🧭 Campus Roadmap

Your syllabus. Your topics. The right lecture.

Campus Roadmap is a college study platform that turns a syllabus into a simple learning path:

Year → Subject → Unit → Topic → YouTube

No endless YouTube searching. Just follow the syllabus and jump straight to the lecture or playlist you need.

🔗 Live: https://campus-roadmap-alpha.vercel.app/

✨ What it does

Feature

Description

📚 Syllabus Roadmap

Browse subjects and units in a clear structure

▶️ YouTube Lectures

Open curated videos and playlists directly on YouTube

🔎 Search

Find topics quickly across the roadmap

📝 Community Notes

Students can submit PDF notes for a subject/unit

✅ Admin Review

Notes stay pending until an admin approves them

🔐 Private Storage

Notes are stored in a private Supabase bucket

🗺️ How it works

Choose Year
   ↓
Choose Subject
   ↓
Open Unit
   ↓
Pick Topic
   ↓
Watch on YouTube

Community Notes

Student uploads PDF
        ↓
      Pending
        ↓
   Admin reviews
      ↙   ↘
  Approve  Delete
     ↓       ↓
  Published Removed

🛠️ Tech Stack

Next.js 16 · React · TypeScript · Supabase · CSS · YouTube

Architecture

Next.js App Router for the web application

Supabase for database, authentication and private file storage

Server-side routes for secure uploads and admin actions

Signed URLs for temporary PDF access

🔐 Security

Sensitive operations are handled on the server.

Admin actions require authentication.

The Supabase secret key stays server-side.

Direct anonymous Storage uploads are disabled.

PDFs are kept in a private bucket.

PDF access uses short-lived signed URLs.

Deleting a note removes its database record and stored PDF.

Never commit .env.local or expose the Supabase secret key.

🚀 Run locally

npm install
npm run dev

Then open:

http://localhost:3000

Create a .env.local file with your Supabase and admin environment variables before running the project.

🎯 Why Campus Roadmap?

Students often know what is in their syllabus, but waste time finding what to watch for each topic.

Campus Roadmap connects those two things in one place — making the journey from syllabus to lecture simple.
