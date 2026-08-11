const reviewers = ["Tanny", "Noah", "Hannah"];
const rubric = [
  { id: "technical_rubric_alignment", title: "Technical rubric alignment", prompt: "Score adjustments follow the AoPS technical scoring rubric.", anchors: ["Adjustment conflicts with the rubric.", "Score is defensible but the rationale is incomplete.", "Score matches the rubric with a clear rationale."] },
  { id: "technical_edit_calibration", title: "Calibration of technical edits", prompt: "Technical feedback is edited only for accuracy, completeness, or clarity.", anchors: ["Needed corrections are missed or sound work is rewritten.", "Needed and optional edits are distinguished inconsistently.", "Edits are made if and only if the mathematics calls for them."] },
  { id: "style_rubric_alignment", title: "Style rubric alignment", prompt: "Style score adjustments follow the style rubric.", anchors: ["The adjustment conflicts with the rubric.", "The score is mostly defensible but somewhat miscalibrated.", "The score matches the rubric and weights clarity correctly."] },
  { id: "style_edit_calibration", title: "Calibration of style edits", prompt: "Style edits address genuine issues without imposing personal preferences.", anchors: ["Edits focus on personal preference.", "The releaser occasionally over-edits.", "Only genuine clarity or elegance issues are edited."] },
  { id: "focus_concision_tailoring", title: "Focus, concision, and tailoring", prompt: "Released feedback is specific, focused, appropriately brief, and suited to the student.", anchors: ["Feedback is generic or unfocused.", "Focus and tailoring are inconsistent.", "Feedback is specific, concise, and student-appropriate."] },
  { id: "grader_comment_actionability", title: "Actionability of grader comments", prompt: "Comments explain edits clearly enough for the grader to act next time.", anchors: ["Comments are vague or missing.", "Some changes are explained clearly.", "Every substantive edit has a clear, actionable explanation."] },
  { id: "tone_toward_graders", title: "Tone toward graders", prompt: "Feedback to the grader is constructive and mentoring.", anchors: ["Tone is harsh or dismissive.", "Tone is professional but inconsistently calibrated.", "Tone is constructive, clear, and encouraging."] },
  { id: "preservation_of_grader_voice", title: "Preservation of grader voice", prompt: "Sound grader feedback keeps the grader’s individual style and voice.", anchors: ["The grader’s voice is replaced.", "The grader’s voice is preserved inconsistently.", "The grader’s voice is preserved wherever the feedback is sound."] },
  { id: "plagiarism_vigilance", title: "Plagiarism vigilance", prompt: "The releaser catches plagiarism or AI-generated work the grader missed.", anchors: ["A clear concern is overlooked.", "Obvious cases are caught but subtler signs are missed.", "Missed concerns are reliably caught and explained."] },
  { id: "admin_comment_judgement", title: "Comments to Admin", prompt: "A 1-star rating or concerning grader pattern gets a clear, relevant Admin comment.", anchors: ["A warranted comment is missing.", "Comments are left inconsistently.", "Every warranted case has a clear, relevant comment."] }
];

const problemMaterials = {
  "demo-001": ["A sequence is defined by a recurrence. Prove that its first six successive differences satisfy the stated bound.", "Show each difference is positive, then sum the recurrence identities.", ["Write the induction hypothesis before using the recurrence."], "A localized missing justification should not be treated as a missing method."],
  "demo-002": ["A marked point lies in a triangle with the indicated equal angles. Determine the requested side ratio.", "Drop the altitude and use the resulting pair of similar right triangles.", ["Look for two right triangles with a second equal angle."], "Accept any correctly labeled similarity argument."],
  "demo-003": ["Determine the possible remainders of the given powers and prove that the pattern holds for every exponent.", "Reduce the exponent modulo four and check all four residue classes.", ["A repeating list is not yet a proof; account for every exponent."], "Omitting one residue class is a substantive gap."],
  "demo-004": ["Count the blue-tile walks of length n subject to the stated final-step rule.", "Partition by the last step to obtain the recurrence, then apply the initial values.", ["Separate walks according to their final move."], "A valid recurrence with correct initial values is complete."],
  "demo-005": ["Solve the polynomial identity under the given sign restriction.", "Factor the difference, split into two cases, and eliminate the incompatible case by sign.", ["Use the sign condition only after factoring."], "Repeated explanation is a style issue, not a technical defect."],
  "demo-006": ["A point is reflected across a diagonal. Find the resulting angle.", "Use equal reflected distances to form an isosceles triangle, then apply the exterior-angle relation.", ["Name the equal segments created by the reflection."], "Require the equal segments to be identified explicitly."],
  "demo-007": ["Pair the indexed coin counts to establish the divisibility claim.", "Pair k with n−k and show each pair has the required common remainder.", ["State the pairing before computing its contribution."], "A correct but unnamed pairing can be a localized omission."],
  "demo-008": ["Count the lattice paths having exactly two turns.", "Choose the two turn positions; these choices determine the path bijectively.", ["Encode a path by the positions where its direction changes."], "Check that the construction is one-to-one and onto."],
  "demo-009": ["Prove the symmetric inequality and identify the equality case.", "Apply AM-GM to paired terms and combine the resulting bounds.", ["Symmetry suggests equality but does not prove the inequality."], "A claimed result without a substantive argument earns minimal credit."],
  "demo-010": ["Use equal tangent lengths to compare the two perimeter expressions.", "Name each equal tangent pair and subtract the perimeter equations so the auxiliary segments cancel.", ["Write both perimeter equations before subtracting."], "The tangent-pair labels may be supplied in words or on a diagram."]
};

let submissions = [];
let view = location.hash.slice(1) || "audit";
let currentId = null;
let detailOrigin = "audit";
let subjectType = "releaser";
let subject = "";
let sampleRate = 10;
let statsKind = "releaser";
let statsName = "";
let sortKey = "date";
let sortDirection = "desc";
let filters = {};
let reviewer = localStorage.getItem("aops-demo-reviewer") || "Tanny";
let saved = JSON.parse(localStorage.getItem("aops-demo-ratings") || "{}");
const seeded = { "demo-001": ["Noah"], "demo-003": ["Hannah"], "demo-005": ["Noah", "Hannah"], "demo-008": ["Tanny"] };
const app = document.querySelector("#app");
const reviewerSelect = document.querySelector("#reviewer");
reviewerSelect.value = reviewer;

function esc(value) { return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]); }
function hash(text) { let value = 2166136261; for (const char of text) { value ^= char.charCodeAt(0); value = Math.imul(value, 16777619); } return value >>> 0; }
function formatDate(value) { return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); }
function formatScore(value) { return Number(value).toFixed(1).replace(/\.0$/, ""); }
function deltaValue(row) { return row.releaseTech - row.graderTech; }
function deltaHtml(value) { const className = value > 0 ? "delta-up" : value < 0 ? "delta-down" : "delta-zero"; return `<span class="delta ${className}">${value > 0 ? "+" : ""}${formatScore(value)}</span>`; }
function people(type = subjectType) { return [...new Set(submissions.map(row => row[type]))].sort(); }
function subjectRows() { return submissions.filter(row => row[subjectType] === subject); }
function sample() { const rows = subjectRows(); const count = Math.max(1, Math.ceil(rows.length * sampleRate / 100)); return [...rows].sort((a, b) => hash(`${subjectType}|${subject}|2026-07-01|${a.id}`) - hash(`${subjectType}|${subject}|2026-07-01|${b.id}`)).slice(0, count); }
function record(id, name = reviewer) { return saved[name]?.[id]; }
function isDone(id, name) { return Boolean(record(id, name)) || Boolean(seeded[id]?.includes(name)); }
function demoNote() { return `<div class="demo-note"><strong>Fabricated demo data.</strong> Ratings are saved only in this browser.</div>`; }

function completionHtml(id) {
  const own = isDone(id, reviewer);
  const others = reviewers.filter(name => name !== reviewer && isDone(id, name)).length;
  return `<div class="completion-badges"><span class="completion ${own ? "completion-complete" : "completion-not_started"}">${own ? "You: complete" : "You: not started"}</span><span class="completion completion-others">Others: ${others}/2 complete</span></div>`;
}

function openButton(row) { return `<button class="table-link table-button" data-open="${esc(row.id)}">${esc(row.problem)}</button>`; }
function workTable(rows) {
  return `<div class="table-wrap audit-work-table"><table><thead><tr><th>Problem</th><th>Grader</th><th>Date</th><th class="number">Tech</th><th>Status</th></tr></thead><tbody>${rows.map(row => `<tr><td>${openButton(row)}</td><td>${esc(row.grader)}</td><td class="nowrap">${formatDate(row.date)}</td><td class="number score-cell">${row.graderTech}</td><td>${completionHtml(row.id)}</td></tr>`).join("")}</tbody></table></div>`;
}

function auditView() {
  const rows = subjectRows();
  const batch = sample();
  const done = batch.filter(row => isDone(row.id, reviewer)).length;
  app.innerHTML = `<div class="page-heading compact-heading"><h1>Audit mode</h1></div>${demoNote()}
    <section class="audit-mode-controls">
      <label>Review<select id="subject-type"><option value="releaser" ${subjectType === "releaser" ? "selected" : ""}>Releaser</option><option value="grader" ${subjectType === "grader" ? "selected" : ""}>Grader</option></select></label>
      <label>${subjectType === "grader" ? "Grader" : "Releaser"}<select id="subject">${people().map(name => `<option ${name === subject ? "selected" : ""}>${esc(name)}</option>`).join("")}</select></label>
      <div class="sample-control"><label>Shared sample<input id="rate" type="number" min="1" max="100" value="${sampleRate}"><span>%</span></label><button class="button button-primary" id="start">Start batch</button></div>
    </section>
    <section class="batch-panel"><header><div><h2>Shared batch</h2><p>Frozen sample; ratings remain private to each reviewer.</p></div><strong>${sampleRate}% sample</strong></header>
      <div class="batch-summary"><span><strong>${batch.length}</strong>sampled from ${rows.length}</span><span><strong>${done}</strong>completed by you</span><span><strong>Open</strong>for the group</span><span><strong>Jul 1</strong>since previous audit</span></div>${workTable(batch)}</section>
    <section class="all-work-panel"><header><h2>All work</h2><span>${rows.length} submissions</span></header>${workTable(rows)}<div class="pagination"><span>Page <strong>1</strong> of <strong>1</strong></span></div></section>`;
  bindOpenButtons();
  document.querySelector("#subject-type").onchange = event => { subjectType = event.target.value; subject = people()[0]; render(); };
  document.querySelector("#subject").onchange = event => { subject = event.target.value; render(); };
  document.querySelector("#start").onclick = () => { sampleRate = Math.min(100, Math.max(1, Number(document.querySelector("#rate").value) || 10)); toast("Shared sample frozen"); render(); };
}

function sortButton(label, key) {
  const arrow = sortKey === key ? (sortDirection === "asc" ? "↑" : "↓") : "↕";
  return `<button class="sort-button" data-sort="${key}">${label}<span class="${sortKey === key ? "sort-active" : "sort-idle"}">${arrow}</span></button>`;
}

function filteredSubmissions() {
  const result = submissions.filter(row => {
    if (filters.grader && row.grader !== filters.grader) return false;
    if (filters.releaser && row.releaser !== filters.releaser) return false;
    if (filters.problem && row.problem !== filters.problem) return false;
    if (filters.minScore && row.graderTech < Number(filters.minScore)) return false;
    if (filters.maxScore && row.graderTech > Number(filters.maxScore)) return false;
    if (filters.dateFrom && row.date.slice(0, 10) < filters.dateFrom) return false;
    if (filters.dateTo && row.date.slice(0, 10) > filters.dateTo) return false;
    if (filters.changed && row.graderTech === row.releaseTech && row.graderStyle === row.releaseStyle) return false;
    if (filters.flagged && !["demo-003", "demo-009"].includes(row.id)) return false;
    return true;
  });
  const values = { problem: row => row.problem, grader: row => row.grader, date: row => row.date, tech: row => row.graderTech, style: row => row.graderStyle, delta: deltaValue };
  return result.sort((left, right) => {
    const a = values[sortKey](left), b = values[sortKey](right);
    const order = typeof a === "number" ? a - b : String(a).localeCompare(String(b));
    return sortDirection === "asc" ? order : -order;
  });
}

function submissionsView() {
  const rows = filteredSubmissions();
  const graders = people("grader"), releasers = people("releaser"), problems = submissions.map(row => row.problem).sort();
  const selected = (name, value) => filters[name] === value ? "selected" : "";
  app.innerHTML = `<div class="page-heading"><div><span class="eyebrow">Submission browser</span><h1>Graded submissions</h1></div></div>${demoNote()}
    <form class="filter-panel" id="filters"><div class="filter-grid">
      <label>Grader<select name="grader"><option value="">All graders</option>${graders.map(name => `<option ${selected("grader", name)}>${esc(name)}</option>`).join("")}</select></label>
      <label>Releaser<select name="releaser"><option value="">All releasers</option>${releasers.map(name => `<option ${selected("releaser", name)}>${esc(name)}</option>`).join("")}</select></label>
      <label class="problem-filter">Problem<select name="problem"><option value="">All problems</option>${problems.map(name => `<option ${selected("problem", name)}>${esc(name)}</option>`).join("")}</select></label>
      <label>Min score<input name="minScore" type="number" min="0" max="7" value="${esc(filters.minScore || "")}"></label>
      <label>Max score<input name="maxScore" type="number" min="0" max="7" value="${esc(filters.maxScore || "")}"></label>
      <label>From<input name="dateFrom" type="date" value="${esc(filters.dateFrom || "")}"></label>
      <label>To<input name="dateTo" type="date" value="${esc(filters.dateTo || "")}"></label>
    </div><div class="filter-actions">
      <label class="check-label"><input name="flagged" type="checkbox" ${filters.flagged ? "checked" : ""}> Flagged only</label>
      <label class="check-label"><input type="checkbox" checked disabled> Released only</label>
      <label class="check-label audit-signal"><input name="changed" type="checkbox" ${filters.changed ? "checked" : ""}> Score changed</label>
      <span class="filter-spacer"></span><button type="button" class="button button-quiet" id="clear">Clear</button><button class="button button-primary">Apply filters</button>
    </div></form>
    <div class="table-heading"><div><strong>${rows.length}</strong> submissions</div><span>50 per page</span></div>
    <div class="table-wrap submission-table"><table><thead><tr><th>${sortButton("Problem", "problem")}</th><th>${sortButton("Grader", "grader")}</th><th>${sortButton("Graded", "date")}</th><th class="number">${sortButton("Tech", "tech")}</th><th class="number">${sortButton("Style", "style")}</th><th class="number">${sortButton("Δ Tech", "delta")}</th><th>Released</th><th>Flagged</th></tr></thead><tbody>${rows.map(row => `<tr><td>${openButton(row)}</td><td>${esc(row.grader)}</td><td class="nowrap">${formatDate(row.date)}</td><td class="number score-cell">${row.graderTech}</td><td class="number">${formatScore(row.graderStyle)}</td><td class="number">${deltaHtml(deltaValue(row))}</td><td><span class="pill pill-release">Released</span></td><td>${["demo-003", "demo-009"].includes(row.id) ? '<span class="pill pill-flag">Flagged</span>' : '<span class="muted">No</span>'}</td></tr>`).join("")}</tbody></table></div>
    <div class="pagination"><span>Page <strong>1</strong> of <strong>1</strong></span></div>`;
  bindOpenButtons();
  document.querySelector("#filters").onsubmit = event => { event.preventDefault(); const form = new FormData(event.currentTarget); filters = Object.fromEntries(form.entries()); filters.flagged = form.has("flagged"); filters.changed = form.has("changed"); render(); };
  document.querySelector("#clear").onclick = () => { filters = {}; render(); };
  document.querySelectorAll("[data-sort]").forEach(button => button.onclick = () => { const next = button.dataset.sort; if (sortKey === next) sortDirection = sortDirection === "asc" ? "desc" : "asc"; else { sortKey = next; sortDirection = "asc"; } render(); });
}

function scorePair(tech, style, originalTech, originalStyle) {
  const techDelta = originalTech === undefined ? "" : deltaHtml(tech - originalTech);
  const styleDelta = originalStyle === undefined ? "" : deltaHtml(Math.round((style - originalStyle) * 10) / 10);
  return `<div class="score-pair"><div><span>Technical</span><strong>${formatScore(tech)}</strong>${techDelta}</div><div><span>Style</span><strong>${formatScore(style)}</strong>${styleDelta}</div></div>`;
}

function detailSection(title, meta, body, className = "") {
  return `<section class="detail-section ${className}"><header><h2>${title}</h2>${meta ? `<div class="section-meta">${meta}</div>` : ""}</header><div class="section-body">${body}</div></section>`;
}

function detailView() {
  const row = submissions.find(item => item.id === currentId);
  const materials = problemMaterials[row.id];
  const values = record(row.id)?.ratings || {};
  const notes = record(row.id)?.notes || "";
  const changed = row.graderTech !== row.releaseTech || row.graderStyle !== row.releaseStyle;
  const index = subjectRows().findIndex(item => item.id === row.id);
  const queue = detailOrigin === "audit" ? `<div class="audit-queue-nav"><span>${esc(subject)} audit queue · ${Math.max(1, index + 1)} of ${subjectRows().length}</span><div>${index > 0 ? `<button class="queue-link" data-open="${subjectRows()[index - 1].id}">← Previous</button>` : "<span>← Previous</span>"}${index >= 0 && index < subjectRows().length - 1 ? `<button class="queue-link" data-open="${subjectRows()[index + 1].id}">Next →</button>` : "<span>Next →</span>"}</div></div>` : "";
  const auditPanel = detailSection("Releaser audit", `<strong>${reviewer}</strong><span>${Object.keys(values).length}/${rubric.length}</span>`, `<div class="audit-meta"><span>Releaser: <strong>${esc(row.releaser)}</strong></span>${record(row.id)?.updatedAt ? `<span>Last saved ${formatDate(record(row.id).updatedAt)}</span>` : ""}</div>
    <div class="rubric-list">${rubric.map(item => `<article class="rubric-row"><div class="rubric-copy"><strong>${item.title}</strong><span>${item.prompt}</span><details><summary>Rating descriptions</summary><ol>${item.anchors.map((anchor, position) => `<li><b>${position + 1}</b>${anchor}</li>`).join("")}</ol></details></div><div class="rating-control" data-category="${item.id}">${[[1, "Developing"], [2, "Approaching"], [3, "Proficient"], ["na", "N/A"]].map(([value, label]) => { const selected = value === "na" ? values[item.id] === null : values[item.id] === value; return `<button class="${selected ? (value === "na" ? "na-selected" : "selected") : ""}" data-value="${value}"><b>${value === "na" ? "—" : value}</b><span>${label}</span></button>`; }).join("")}</div></article>`).join("")}</div>
    <label class="audit-notes">Notes<textarea id="notes" rows="4" placeholder="Optional">${esc(notes)}</textarea></label><div class="audit-actions"><span id="save-message"></span><button class="button button-primary" id="save">Save audit</button></div>`, "audit-panel");
  app.innerHTML = `${queue}<div class="detail-titlebar"><div><button class="back-link" id="back">← ${detailOrigin === "audit" ? "Audit mode" : "All submissions"}</button><h1>${esc(row.problem)}</h1><code>${esc(row.id)}</code></div></div><div class="detail-stack">
    <details class="problem-materials"><summary><span><strong>Problem materials</strong><small>Statement, official solution, hints, and grading tips</small></span><em>${materials[2].length} hint</em></summary><div class="problem-materials-body"><section><h2>Problem statement</h2><p>${esc(materials[0])}</p></section><section><h2>Official solution</h2><p>${esc(materials[1])}</p></section><section><h2>Hints</h2>${materials[2].map((hint, number) => `<div class="hint"><strong>Hint ${number + 1}</strong><p>${esc(hint)}</p></div>`).join("")}</section><section class="grading-tips"><h2>Grading tips</h2><p>${esc(materials[3])}</p></section></div></details>
    ${detailSection("Student work", "", `<div class="markup"><p>${esc(row.student)}</p></div>`)}
    ${detailSection("Grader evaluation", `<strong>${esc(row.grader)}</strong><span>${formatDate(row.date)}</span>`, `${scorePair(row.graderTech, row.graderStyle)}<div class="markup"><p>${esc(row.graderFeedback)}</p></div>`)}
    ${detailSection("Release 1", `<strong>${esc(row.releaser)}</strong><span>${formatDate(row.date)}</span>`, `${scorePair(row.releaseTech, row.releaseStyle, row.graderTech, row.graderStyle)}${changed ? '<p class="change-callout">Released score differs from the grader’s score.</p>' : ""}<div class="markup"><p>${esc(row.releasedFeedback)}</p></div><div class="releaser-comment"><h3>Releaser → grader/admin</h3><div class="markup"><p>${esc(row.releaserComment)}</p></div></div>`, changed ? "changed-section" : "")}
    ${auditPanel}
    ${detailSection("Ratings", "<span>1 recorded</span>", `<div class="ratings-grid"><article><div class="stars" aria-label="4 out of 5 stars">★★★★☆</div><strong>${esc(row.releaser)}</strong><span>${formatDate(row.date)}</span><div class="rating-comment"><small>Rating comment / admin note</small><div class="markup"><p>Fabricated rating shown for the demo.</p></div></div></article></div>`)}
  </div>`;
  document.querySelector("#back").onclick = () => { currentId = null; view = detailOrigin; render(); };
  bindOpenButtons();
  document.querySelectorAll(".rating-control button").forEach(button => button.onclick = () => { button.parentElement.querySelectorAll("button").forEach(item => item.className = ""); button.className = button.dataset.value === "na" ? "na-selected" : "selected"; document.querySelector("#save-message").textContent = "Unsaved changes"; });
  document.querySelector("#notes").oninput = () => document.querySelector("#save-message").textContent = "Unsaved changes";
  document.querySelector("#save").onclick = () => { const ratings = {}; document.querySelectorAll(".rating-control").forEach(group => { const selected = group.querySelector(".selected, .na-selected"); if (selected) ratings[group.dataset.category] = selected.dataset.value === "na" ? null : Number(selected.dataset.value); }); saved[reviewer] ??= {}; saved[reviewer][row.id] = { ratings, notes: document.querySelector("#notes").value, updatedAt: new Date().toISOString() }; localStorage.setItem("aops-demo-ratings", JSON.stringify(saved)); document.querySelector("#save-message").textContent = "Saved"; toast(`Audit saved for ${reviewer}`); };
}

function average(rows, key) { return rows.reduce((sum, row) => sum + row[key], 0) / Math.max(1, rows.length); }
function statsView() {
  const names = people(statsKind);
  if (!statsName || !names.includes(statsName)) statsName = names[0];
  const rows = submissions.filter(row => row[statsKind] === statsName);
  const changed = rows.filter(row => row.graderTech !== row.releaseTech || row.graderStyle !== row.releaseStyle);
  const raised = rows.filter(row => deltaValue(row) > 0).length, lowered = rows.filter(row => deltaValue(row) < 0).length;
  const cards = statsKind === "grader"
    ? [["Submissions", rows.length], ["Mean technical", formatScore(average(rows, "graderTech"))], ["Mean style", formatScore(average(rows, "graderStyle"))], ["Changed on release", `${Math.round(changed.length / Math.max(1, rows.length) * 100)}%`], ["Mean star rating", "—"]]
    : [["Submissions", rows.length], ["Release events", rows.length], ["Changed score", `${Math.round(changed.length / Math.max(1, rows.length) * 100)}%`], ["Mean tech delta", formatScore(rows.reduce((sum, row) => sum + deltaValue(row), 0) / Math.max(1, rows.length))], ["Mean rating given", "—"]];
  app.innerHTML = `<div class="stats-tabs"><button data-kind="releaser" class="${statsKind === "releaser" ? "active" : ""}">Releasers</button><button data-kind="grader" class="${statsKind === "grader" ? "active" : ""}">Graders</button></div><div class="page-heading people-heading"><div><h1>${statsKind === "grader" ? "Graders" : "Releasers"}</h1></div><label>Choose ${statsKind}<select id="stats-name">${names.map(name => `<option ${name === statsName ? "selected" : ""}>${esc(name)}</option>`).join("")}</select></label></div>${demoNote()}<div class="stats-grid">${cards.map(([label, value]) => `<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`).join("")}</div><section class="analysis-panel"><h2>${statsKind === "grader" ? "Technical score distribution" : "Adjustment direction"}</h2><div class="direction-grid"><div class="stat-card"><span>Raised</span><strong>${raised}</strong></div><div class="stat-card"><span>Lowered</span><strong>${lowered}</strong></div><div class="stat-card"><span>Unchanged technical</span><strong>${rows.length - raised - lowered}</strong></div><div class="stat-card"><span>Mean style delta</span><strong>${formatScore(rows.reduce((sum, row) => sum + row.releaseStyle - row.graderStyle, 0) / Math.max(1, rows.length))}</strong></div></div></section><section class="all-work-panel"><header><h2>Submissions</h2><span>${rows.length} records</span></header>${workTable(rows)}</section>`;
  bindOpenButtons();
  document.querySelectorAll("[data-kind]").forEach(button => button.onclick = () => { statsKind = button.dataset.kind; statsName = ""; render(); });
  document.querySelector("#stats-name").onchange = event => { statsName = event.target.value; render(); };
}

function bindOpenButtons() { document.querySelectorAll("[data-open]").forEach(button => button.onclick = () => { detailOrigin = view; currentId = button.dataset.open; render(); }); }
function render() { document.querySelectorAll("nav a").forEach(link => link.classList.toggle("active", link.dataset.view === view)); if (currentId) return detailView(); if (view === "audit") return auditView(); if (view === "stats") return statsView(); submissionsView(); }
function toast(text) { const element = document.querySelector("#toast"); element.textContent = text; element.classList.add("show"); setTimeout(() => element.classList.remove("show"), 1600); }

document.querySelectorAll("[data-view]").forEach(link => link.onclick = event => { event.preventDefault(); view = link.dataset.view; currentId = null; history.replaceState(null, "", `#${view}`); render(); });
reviewerSelect.onchange = () => { reviewer = reviewerSelect.value; localStorage.setItem("aops-demo-reviewer", reviewer); render(); };
fetch("fake-submissions.json").then(response => response.json()).then(data => { submissions = data; subject = people()[0]; render(); }).catch(() => { app.innerHTML = '<div class="demo-note">The fabricated demo data could not be loaded.</div>'; });
