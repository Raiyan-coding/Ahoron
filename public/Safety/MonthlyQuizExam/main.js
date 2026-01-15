/* main.js — MonthlyQuizExam (updated)
   - Supports new JSON schema: data.sets [{id, alias, questions:[{q,a,correct}]}]
   - Backwards compatible with data.papers (legacy)
   - Uses Dhaka time (UTC+6)
   - Deterministic schedule & deterministic paper selection (seeded)
*/

/* ---------- CONFIG ---------- */
const WEB3FORMS_ACCESS_KEY = "WEB3FORMS_ACCESS_KEY"; // <-- REPLACE with your key
const EXAM_HOUR_DHAKA = 21; // 9 PM Dhaka
const SHORT_SUBJECT_IDS = new Set(["higher-math","physics","chemistry","biology","ict"]); // 25-min subjects
const SUBJECTS = [
  {id:"bangla-1", name:"Bangla — 1st Paper", file:"bangla-1.json"},
  {id:"bangla-2", name:"Bangla — 2nd Paper", file:"bangla-2.json"},
  {id:"math", name:"Math", file:"math.json"},
  {id:"higher-math", name:"Higher Math", file:"higher-math.json"},
  {id:"physics", name:"Physics", file:"physics.json"},
  {id:"chemistry", name:"Chemistry", file:"chemistry.json"},
  {id:"biology", name:"Biology", file:"biology.json"},
  {id:"bgs", name:"Bangladesh & Global Studies", file:"bgs.json"},
  {id:"ict", name:"ICT", file:"ict.json"},
  {id:"religion", name:"Religion", file:"religion.json"}
];

/* ---------- Utilities: Dhaka time helpers ---------- */
function nowUtcMs(){ return Date.now(); }
function dhakaUtcMsFromComponents(year, monthIndex, day, hour, minute=0){
  // Return UTC timestamp (ms) for given Dhaka local time Y/M/D H:M.
  // Dhaka = UTC + 6 -> UTC hour = hour - 6
  return Date.UTC(year, monthIndex, day, hour - 6, minute, 0);
}
function getDhakaNow(){
  // return a Date object representing current time in Dhaka (for display)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + 6 * 60 * 60000);
}
function fmtDate(year, monthIndex, day){
  const dt = new Date(Date.UTC(year, monthIndex, day, 0,0,0));
  return dt.toLocaleDateString(undefined, {day:"numeric", month:"short"});
}

/* ---------- Deterministic RNG (seeded) ---------- */
function xfnv1a(str) {
  for (var i = 0, h = 2166136261 >>> 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  }
  return function() { return h >>> 0; };
}
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
function seededRandom(seedStr){
  const sfn = xfnv1a(seedStr);
  const seed = sfn();
  return mulberry32(seed);
}
function seededShuffle(array, seedStr){
  const arr = array.slice();
  const rnd = seededRandom(seedStr);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function pickPaperIndex(seedStr, count){
  const rnd = seededRandom(seedStr)();
  return Math.floor(rnd * count);
}

/* ---------- DOM refs ---------- */
const scheduleInfo = document.getElementById("scheduleInfo");
const scheduleList = document.getElementById("scheduleList");
const scheduleFooter = document.getElementById("scheduleFooter");
const notExam = document.getElementById("notExam");
const examWidget = document.getElementById("examWidget");
const examTitle = document.getElementById("examTitle");
const paperInfo = document.getElementById("paperInfo");
const examTimer = document.getElementById("examTimer");
const questionsList = document.getElementById("questionsList");
const submitBtn = document.getElementById("submitBtn");
const studentNameInput = document.getElementById("studentName");
const studentEmailInput = document.getElementById("studentEmail");
const resultWidget = document.getElementById("resultWidget");

// Persist student name/email so the user only enters once
studentNameInput.value = localStorage.getItem('aq_studentName') || "";
studentEmailInput.value = localStorage.getItem('aq_studentEmail') || "";
studentNameInput.addEventListener('change', ()=> localStorage.setItem('aq_studentName', studentNameInput.value.trim()));
studentEmailInput.addEventListener('change', ()=> localStorage.setItem('aq_studentEmail', studentEmailInput.value.trim()));

/* ---------- Main logic ---------- */
async function init(){
  const dhakaNow = getDhakaNow();
  const year = dhakaNow.getFullYear();
  const monthIndex = dhakaNow.getMonth(); // 0-based
  const lastDay = new Date(year, monthIndex+1, 0).getDate();
  const startDay = lastDay - 9; // last 10 days: startDay..lastDay

  // schedule publish day = startDay - 20 (min 1)
  const schedulePublishDay = Math.max(1, startDay - 20);

  // determine whether schedule should be visible
  const schedulePublishUtc = dhakaUtcMsFromComponents(year, monthIndex, schedulePublishDay, 0, 0);
  const nowUtc = nowUtcMs();

  // deterministic schedule: shuffle 10 subjects for the month
  const monthSeed = `${year}-${String(monthIndex+1).padStart(2,"0")}-schedule`;
  const shuffled = seededShuffle(SUBJECTS, monthSeed);

  // build schedule mapping day -> subject
  const schedule = [];
  for(let i=0;i<10;i++){
    const dayNum = startDay + i;
    schedule.push({ day: dayNum, subject: shuffled[i] });
  }

  // show schedule or show publish date message
  if(nowUtc >= schedulePublishUtc){
    scheduleInfo.textContent = "Published routine (visible 20 days before exams)";
    scheduleList.innerHTML = "";
    for(const item of schedule){
      const li = document.createElement("li");
      li.innerHTML = `<span class="date">${item.day} ${dhakaMonthName(monthIndex)}</span><span class="sub">${item.subject.name}</span>`;
      scheduleList.appendChild(li);
    }
    scheduleFooter.textContent = `Exam window: ${startDay} → ${lastDay} (last 10 days of month). Exams start daily at 9:00 PM (Dhaka).`;
  } else {
    scheduleInfo.textContent = "Routine will be published soon";
    const pubDateStr = fmtDate(year, monthIndex, schedulePublishDay);
    scheduleList.innerHTML = `<li class="muted">Routine will be published on <strong>${pubDateStr}</strong></li>`;
    scheduleFooter.textContent = `Come back then — the routine will be visible 20 days prior to the exam window.`;
  }

  // check if today is within exam window
  const dhDay = dhakaNow.getDate();
  if(dhDay >= startDay && dhDay <= lastDay){
    const todayIndex = dhDay - startDay;
    const todays = schedule[todayIndex];
    // setup exam gating (using UTC ms comparisons)
    const examStartUtc = dhakaUtcMsFromComponents(year, monthIndex, dhDay, EXAM_HOUR_DHAKA, 0);
    const durationMinutes = SHORT_SUBJECT_IDS.has(todays.subject.id) ? 25 : 30;
    const examEndUtc = examStartUtc + durationMinutes * 60 * 1000;

    if(nowUtc >= examStartUtc && nowUtc <= examEndUtc){
      // show exam widget and load paper
      notExam.classList.add("hidden");
      examWidget.classList.remove("hidden");
      resultWidget.classList.add("hidden");
      await loadExamPaper(year, monthIndex, dhDay, todays.subject, examStartUtc, examEndUtc, durationMinutes);
    } else {
      // no exam at this moment (but show today's scheduled subject)
      notExam.classList.remove("hidden");
      examWidget.classList.add("hidden");
      scheduleFooter.innerHTML += ` Today (${dhDay}) scheduled: <strong>${todays.subject.name}</strong>.`;
    }
  } else {
    // not exam window (show nothing special)
    notExam.classList.remove("hidden");
    examWidget.classList.add("hidden");
    scheduleFooter.innerHTML += ` Next exam window starts on ${startDay}.`;
  }
}

/* ---------- helper: month short name ---------- */
function dhakaMonthName(monthIndex){
  return new Date(2020, monthIndex, 1).toLocaleDateString(undefined, {month:"short"});
}

/* ---------- load paper & render questions ---------- */
async function loadExamPaper(year, monthIndex, day, subject, examStartUtc, examEndUtc, durationMinutes){
  examTitle.textContent = `${subject.name} — Exam`;
  const paperSeed = `${year}-${String(monthIndex+1).padStart(2,"0")}-${String(day).padStart(2,"0")}|${subject.id}`;

  // Try to fetch subject file
  const filePath = `./quizdata/${subject.file}`;
  let data = null;
  try {
    const r = await fetch(filePath, {cache:"no-store"});
    if(!r.ok) throw new Error("not found");
    data = await r.json();
  } catch (err) {
    // If missing JSON, show clear error and demo note
    paperInfo.textContent = `No question data found for "${subject.name}". Demo JSON missing. (Add ./quizdata/${subject.file})`;
    questionsList.innerHTML = `<div class="muted">Demo data not available for this subject. Please add the JSON file or test during a subject that has a JSON (math.json demo is included).</div>`;
    // Still show timer countdown
    startExamTimer(examStartUtc, examEndUtc);
    return;
  }

  // Normalize data: support legacy .papers OR new .sets
  let paper = null;
  let paperAlias = null; // alias (board-year) if provided

  if(Array.isArray(data.papers) && data.papers.length > 0){
    // legacy format: use data.papers as-is
    const idx = pickPaperIndex(paperSeed, data.papers.length);
    paper = data.papers[idx];
    // legacy uses q.id and q.text and q.options and q.answer (existing code expects this)
    paperAlias = data.alias || data.board || null;
  } else if(Array.isArray(data.sets) && data.sets.length > 0){
    // new format: sets with {id, alias, questions:[{q,a,correct}]}
    const idx = pickPaperIndex(paperSeed, data.sets.length);
    const set = data.sets[idx];
    paperAlias = set.alias || null;

    // Map new structure to legacy 'paper' shape expected later in code
    const mappedQuestions = (set.questions || []).map((qq, i) => {
      return {
        id: `${set.id}-q${i+1}`,
        text: qq.q || qq.text || `Q${i+1}`,
        options: qq.a || qq.options || [],
        // canonicalize answer index to 'answer' property (legacy expects q.answer)
        answer: typeof qq.correct !== "undefined" ? qq.correct : (typeof qq.answer !== "undefined" ? qq.answer : undefined)
      };
    });

    paper = {
      paperId: set.id,
      questions: mappedQuestions
    };
  } else {
    paperInfo.textContent = "No papers/sets found in JSON.";
    questionsList.innerHTML = `<div class="muted">Add 'papers' or 'sets' array to JSON with at least one entry.</div>`;
    startExamTimer(examStartUtc, examEndUtc);
    return;
  }

  // At this point 'paper' has {paperId, questions[]} and questions[].answer exists if answers known
  paperInfo.textContent = `Paper: ${paper.paperId} — ${paper.questions.length} MCQ — ${durationMinutes} min` + (paperAlias ? ` — ${paperAlias}` : "");
  renderQuestions(paper);
  startExamTimer(examStartUtc, examEndUtc);

  // submit handler
  submitBtn.onclick = async () => {
    const answers = gatherAnswers();
    const studentName = studentNameInput.value.trim();
    const studentEmail = studentEmailInput.value.trim();
    // compute score if answers include `answer` key
    let score = null;
    if(paper.questions.every(q=>typeof q.answer !== "undefined")){
      score = 0;
      for(const q of paper.questions){
        const a = answers[q.id];
        if(typeof a !== "undefined" && Number(a) === Number(q.answer)) score++;
      }
    }
    await sendSubmission({
      subjectId: subject.id,
      subjectName: subject.name,
      paperId: paper.paperId,
      answers,
      studentName,
      studentEmail,
      score,
      alias: paperAlias
    });
  };
}

function renderQuestions(paper){
  questionsList.innerHTML = "";
  for(let i=0;i<paper.questions.length;i++){
    const q = paper.questions[i];
    const div = document.createElement("div");
    div.className = "q-card";
    div.innerHTML = `
      <div class="q-text"><strong>${i+1}.</strong> ${escapeHtml(q.text)}</div>
      <div class="options" id="opt-${q.id}">
        ${q.options.map((opt,oi)=>`<label><input type="radio" name="${q.id}" value="${oi}"/> ${escapeHtml(opt)}</label>`).join("")}
      </div>
    `;
    questionsList.appendChild(div);
  }
}

function gatherAnswers(){
  const ans = {};
  const radios = questionsList.querySelectorAll('input[type="radio"]:checked');
  radios.forEach(r=>{
    ans[r.name] = Number(r.value);
  });
  return ans;
}

function escapeHtml(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

/* ---------- timer ---------- */
let timerInterval = null;
function startExamTimer(examStartUtc, examEndUtc){
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    const now = nowUtcMs();
    if(now < examStartUtc){
      // exam hasn't started yet (rare since we call this during exam window)
      const leftMs = examStartUtc - now;
      examTimer.textContent = `Starts in ${msToClock(leftMs)}`;
    } else if (now >= examStartUtc && now <= examEndUtc){
      const leftMs = examEndUtc - now;
      examTimer.textContent = msToClock(leftMs);
      if(leftMs <= 0){
        // time over: auto-submit
        clearInterval(timerInterval);
        autoSubmitOnTimeout();
      }
    } else {
      examTimer.textContent = "--:--";
      clearInterval(timerInterval);
    }
  }, 500);
}

function msToClock(ms){
  if(ms<0) ms = 0;
  const total = Math.floor(ms/1000);
  const mins = Math.floor(total/60);
  const secs = total % 60;
  return `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
}

async function autoSubmitOnTimeout(){
  submitBtn.disabled = true;
  submitBtn.textContent = "Auto-submitting...";
  const answers = gatherAnswers();
  await sendSubmission({auto:true, answers});
}

/* ---------- send submission to Web3Forms ---------- */
async function sendSubmission(payload){
  // Build a human-friendly body for email
  const body = {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: `Exam Submission — ${payload.subjectName} — ${payload.paperId}`,
    name: payload.studentName || "Anonymous",
    email: payload.studentEmail || "",
    content: JSON.stringify({
      subjectId: payload.subjectId,
      paperId: payload.paperId,
      alias: payload.alias || null,
      answers: payload.answers,
      score: payload.score ?? "N/A",
      auto: payload.auto ? true : false,
      timestamp_utc: new Date().toISOString()
    }, null, 2)
  };

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(body)
    });
    const json = await res.json();
    showResult({ok:true, payload, resp:json});
  } catch (err) {
    showResult({ok:false, err});
  }
}

/* ---------- showResult ---------- */
function showResult(info){
  examWidget.classList.add("hidden");
  resultWidget.classList.remove("hidden");
  if(info.ok){
    const manualNote = info.payload && info.payload.manual ? `<p class="muted small"><strong>Note:</strong> This exam is graded manually and results will be added later by the instructor.</p>` : ``;
    resultWidget.innerHTML = `<h3>Submission Received</h3>
      <p class="muted">Thanks${info.payload.studentName ? ", " + escapeHtml(info.payload.studentName) : ""} — your answers were submitted.</p>
      <p class="small muted">Score (if computed): <strong>${info.payload.score ?? "N/A"}</strong></p>
      ${manualNote}
      <pre class="muted small">${escapeHtml(JSON.stringify(info.payload.answers, null, 2))}</pre>
      <p class="muted small">You will receive a confirmation email if you provided one.</p>
    `;
  } else {
    resultWidget.innerHTML = `<h3>Submission Failed</h3><p class="muted">There was an error sending your answers. Try again — or check your connection.</p>`;
    console.error(info.err);
  }
}

/* ---------- Init app ---------- */
init();




