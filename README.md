# Ahoron - Web

This is a small static site scaffold for Ahoron (SSC prep):

Files created:
- `index.html` - Home
- `courses.html` - Courses listing (uses `data.js`)
- `learn.html` - Video/PDF materials
- `instructors.html` - Founders/instructors
- `exams.html` - Links to Google Form mock tests
- `about.html` - About us
- `contact.html` - Contact details
- `data.js` - Course data used by `courses.html`
- `assets/main.css` - Main stylesheet
- `assets/logo.png` - Tiny placeholder logo (replace with your real logo)

How to preview:
- Open `index.html` in a browser, or run a simple HTTP server:
  - Python 3: `python -m http.server 8000` (run from project folder) and open http://localhost:8000

Next steps you might want:
- Replace placeholder images / videos / Google Form links with real assets
- Add real PDFs into an `assets/docs` folder and update `learn.html`
- Add analytics, SEO tags and meta descriptions

If you want, I can wire up a small build script or a simple live-server task to preview automatically. Tell me which you'd prefer.

---

## MonthlyQuizExam — results & submission schema 🔧

- Submissions are sent to your Web3Forms endpoint as JSON in the `content` field. The app now submits the following structured JSON (example):

```json
{
  "subjectId": "math",
  "subjectName": "Math",
  "paperId": "math-01",
  "studentName": "Alice",
  "studentEmail": "alice@example.com",
  "totalQuestions": 30,
  "correctCount": 25,
  "wrongCount": 5,
  "unansweredCount": 0,
  "timeTakenSec": 1200,
  "resultSheet": [ { "id":"q1","text":"...","correctIndex":1,"chosenIndex":2,"correct":false } ],
  "answers": { "q1":2, "q2":1 },
  "auto": false,
  "timestamp_utc": "2025-12-27T15:00:00Z"
}
```

- You can copy the JSON posted by Web3Forms (it will be in the email body) into `MonthlyQuizExam/result.json` to publish monthly results on `result.html`.
- The `result.html` page expects `result.json` with the following structure: `{ "months": [ { "monthId": "YYYY-MM", "label": "Mon YYYY", "subjects": [ { "subjectId": "math", "subjectName": "Math", "submissions": [ ... ] } ] } ] }`.

Local submissions (Plan B):
- The app saves each submission in the browser's `localStorage` under `aq_submissions` and automatically triggers a JSON download for admin collection.
- Use the `result.html` page to import saved JSON files or load submissions from the browser (the page has controls to import a JSON file, load local browser submissions, or download all local submissions).
- After the exam window (last 10 days of the month) ends, an administrator can click **Publish Combined Results** on `result.html` to aggregate per-student results across subjects. The combined result is saved to `localStorage` under `aq_published` and can be downloaded as a single JSON file for recordkeeping or later sending via a web service.

If you'd like, I can add an admin-only merge/import button that automatically merges multiple saved submission files into the combined JSON, or implement Plan A server-side collection later; tell me which you prefer.