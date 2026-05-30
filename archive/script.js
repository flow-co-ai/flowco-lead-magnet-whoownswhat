/* ============================================================
   Flow Co. — Who owns what. Where it breaks.
   ============================================================ */

const ROLES = {
  paid:    { name: "Paid media",  scope: "Ad spend, targeting, bidding, audience lists", color: "var(--r-paid)" },
  seo:     { name: "SEO / local", scope: "Rankings, GBP, citations, local visibility",   color: "var(--r-seo)" },
  content: { name: "Content",     scope: "Organic, video, email copy, blog",              color: "var(--r-content)" },
  web:     { name: "Web / dev",   scope: "Pages, speed, mobile UX, form logic",           color: "var(--r-web)" },
  crm:     { name: "CRM / auto",  scope: "Pipelines, follow-up, lead routing",            color: "var(--r-crm)" },
  track:   { name: "Tracking",    scope: "Pixels, UTMs, conversion events",               color: "var(--r-track)" },
  rep:     { name: "Reputation",  scope: "Reviews, GBP posts, response cadence",          color: "var(--r-rep)" },
};

const ROLE_ORDER = ["paid", "seo", "content", "web", "crm", "track", "rep"];

const OVERLAPS = [
  { roles: ["paid", "track"], share: "Conversion event setup, pixel fires, UTM structure",
    gap: "Ads report clicks, zero conversions. Pixel misfired or UTM stripped. Spend continues, attribution is dead." },
  { roles: ["paid", "web"], share: "Landing page load speed, mobile UX, Quality Score",
    gap: "Ad spends $40/click into a 6-second mobile page. CPL doubles. Neither team knows why." },
  { roles: ["paid", "crm"], share: "Lead source tagging, audience list sync, retargeting pools",
    gap: "Leads enter CRM with no source tag. Attribution gone. Retargeting never rebuilds." },
  { roles: ["content", "seo"], share: "Keyword alignment, indexable assets, content clusters",
    gap: "Posts 3x/week. None targets a keyword. GBP and blog have zero overlap. Traffic flatlines." },
  { roles: ["content", "crm"], share: "Nurture sequence copy, post-lead follow-up assets",
    gap: "Leads get a generic auto-reply then silence. Content exists. Nobody wired it into the sequence." },
  { roles: ["web", "crm"], share: "Form-to-CRM field mapping, confirmation logic, lead routing",
    gap: "Form submits. No CRM record created. No confirmation sent. Lead disappears. Nobody notices for weeks." },
  { roles: ["web", "track"], share: "Tag manager config, event triggers, data layer integrity",
    gap: "Dev pushes update. Half the conversion triggers break. Paid optimizes blind for three weeks." },
  { roles: ["rep", "seo"], share: "Review velocity signals, GBP keyword content, platform distribution",
    gap: "4.8 stars on Yelp, 11 reviews on Google. GBP ranking tanks. Volume is what the algorithm reads." },
  { roles: ["crm", "track"], share: "Lead attribution, pipeline-stage visibility, offline conversion import",
    gap: "Paid optimizes toward form fills. Half never book. CRM data never feeds the pixel. ROAS is fiction." },
  { roles: ["content", "paid"], share: "Ad creative sourcing, organic-to-paid testing pipeline, social proof",
    gap: "Paid runs stock photos. Content has 40 videos that outperform. Nobody shared them." },
];

/* ---------------- Detect traffic medium ---------------- */
function detectMedium() {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get("utm_medium");
  if (utm) return utm.charAt(0).toUpperCase() + utm.slice(1);
  const ref = document.referrer;
  if (!ref) return "Direct";
  if (ref.includes("instagram")) return "Instagram";
  if (ref.includes("facebook") || ref.includes("fb.")) return "Facebook";
  if (ref.includes("linkedin")) return "LinkedIn";
  if (ref.includes("twitter") || ref.includes("t.co")) return "Twitter";
  if (ref.includes("google")) return "Google";
  if (ref.includes("tiktok")) return "TikTok";
  return "Referral";
}

/* ---------------- Hero node network ---------------- */
const NODE_POS = {
  paid:    [245, 70],
  track:   [70, 152],
  seo:     [412, 168],
  rep:     [238, 246],
  crm:     [96, 348],
  content: [372, 356],
  web:     [216, 430],
};

const HERO_LINKS = [
  ["paid","track"],["paid","web"],["paid","crm"],["content","seo"],
  ["content","crm"],["web","crm"],["web","track"],["rep","seo"],
  ["crm","track"],["content","paid"],
];

const HEX_MAP = {
  paid:"#378ADD", seo:"#639922", content:"#BA7517", web:"#7c3aed",
  crm:"#0F6E56", track:"#D85A30", rep:"#993556",
};
function HEX(k) { return HEX_MAP[k]; }

function buildHeroViz() {
  const svg = document.getElementById("heroViz");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  HERO_LINKS.forEach(([a, b], i) => {
    const [x1, y1] = NODE_POS[a], [x2, y2] = NODE_POS[b];
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", x1); l.setAttribute("y1", y1);
    l.setAttribute("x2", x2); l.setAttribute("y2", y2);
    l.setAttribute("class", "node-line");
    l.style.animationDelay = (0.3 + i * 0.06) + "s";
    svg.appendChild(l);
  });
  ROLE_ORDER.forEach((key, i) => {
    const [x, y] = NODE_POS[key];
    const isCenter = key === "rep";
    const r = isCenter ? 30 : 22;
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "node");
    g.style.animationDelay = (0.5 + i * 0.08) + "s";

    const halo = document.createElementNS(NS, "circle");
    halo.setAttribute("cx", x); halo.setAttribute("cy", y); halo.setAttribute("r", r + 8);
    halo.setAttribute("fill", HEX(key)); halo.setAttribute("opacity", "0.10");

    const wrapG = document.createElementNS(NS, "g");
    wrapG.setAttribute("class", "node-core");
    wrapG.style.animationDelay = (i * 0.4) + "s";
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", r);
    c.setAttribute("fill", "#fff");
    c.setAttribute("stroke", HEX(key));
    c.setAttribute("stroke-width", isCenter ? "2.5" : "1.6");
    const inner = document.createElementNS(NS, "circle");
    inner.setAttribute("cx", x); inner.setAttribute("cy", y); inner.setAttribute("r", isCenter ? 8 : 6);
    inner.setAttribute("fill", HEX(key));
    wrapG.appendChild(c); wrapG.appendChild(inner);

    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", x); t.setAttribute("y", y + r + 16);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("class", "node-label");
    t.textContent = ROLES[key].name;

    g.appendChild(halo); g.appendChild(wrapG); g.appendChild(t);
    svg.appendChild(g);
  });
}

/* ---------------- Render role cards ---------------- */
const rolesEl = document.getElementById("roles");
ROLE_ORDER.forEach((key) => {
  const r = ROLES[key];
  const btn = document.createElement("button");
  btn.className = "role";
  btn.dataset.role = key;
  btn.style.setProperty("--rc", r.color);
  btn.innerHTML = `
    <div class="role__dot"></div>
    <div class="role__name">${r.name}</div>
    <div class="role__scope">${r.scope}</div>`;
  btn.addEventListener("click", () => toggleFilter(key));
  rolesEl.appendChild(btn);
});

/* ---------------- Render overlap table ---------------- */
const tableEl = document.getElementById("table");
OVERLAPS.forEach((o) => {
  const row = document.createElement("div");
  row.className = "row";
  row.dataset.roles = o.roles.join(",");
  const [a, b] = o.roles;
  row.innerHTML = `
    <div class="row__roles">
      <span class="chip"><span class="chip__dot" style="background:${ROLES[a].color}"></span>${ROLES[a].name}</span>
      <span class="row__plus">paired with</span>
      <span class="chip"><span class="chip__dot" style="background:${ROLES[b].color}"></span>${ROLES[b].name}</span>
    </div>
    <div class="row__share">${o.share}</div>
    <div class="row__gap">${o.gap}</div>`;
  tableEl.appendChild(row);
});

/* ---------------- Filtering ---------------- */
let activeFilter = null;
const filterTag = document.getElementById("filterTag");
const filterCount = document.getElementById("filterCount");

function toggleFilter(key) {
  activeFilter = activeFilter === key ? null : key;
  applyFilter();
}

function applyFilter() {
  const rows = [...document.querySelectorAll(".row")];
  const cards = [...document.querySelectorAll(".role")];

  cards.forEach((c) => {
    const isActive = c.dataset.role === activeFilter;
    c.classList.toggle("active", isActive);
    c.classList.toggle("dim", activeFilter && !isActive);
  });

  let matches = 0;
  rows.forEach((row) => {
    const involved = row.dataset.roles.split(",").includes(activeFilter);
    const match = !activeFilter || involved;
    row.classList.toggle("faded", !!activeFilter && !involved);
    if (match && activeFilter) matches++;
  });

  if (activeFilter) {
    const r = ROLES[activeFilter];
    filterTag.classList.add("show");
    filterTag.querySelector(".filter-tag__swatch").style.background = r.color;
    filterTag.querySelector(".filter-tag__name").textContent = r.name;
    filterCount.textContent = `${matches} overlap point${matches === 1 ? "" : "s"} touch this role`;
    filterCount.style.display = "inline";
  } else {
    filterTag.classList.remove("show");
    filterCount.style.display = "none";
  }
}

document.querySelector(".filter-tag__clear").addEventListener("click", () => {
  activeFilter = null;
  applyFilter();
});

/* ---------------- Email gate (3-field) ---------------- */
const gateForm       = document.getElementById("gateForm");
const gateInput      = document.getElementById("gateInput");
const gateNameInput  = document.getElementById("gateName");
const gateCompany    = document.getElementById("gateCompany");
const gateSuccess    = document.getElementById("gateSuccess");
const gateNote       = document.getElementById("gateNote");
const gatedSection   = document.getElementById("gated");
const submitBtn      = document.getElementById("gateSubmit");
let unlocked = false;

gateForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (unlocked) return;

  const name    = gateNameInput.value.trim();
  const email   = gateInput.value.trim();
  const company = gateCompany.value.trim();

  // Basic validation
  if (!name) { showError("Enter your name to unlock the tool."); gateNameInput.focus(); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showError("Enter a valid work email."); gateInput.focus(); return; }
  if (!company) { showError("Enter your company name."); gateCompany.focus(); return; }

  // Loading state
  submitBtn.textContent = "Unlocking…";
  submitBtn.disabled = true;

  const medium = detectMedium();

  // Fire-and-forget to Monday — don't block UX on API response
  fetch("/.netlify/functions/capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, company, medium }),
  }).catch((err) => console.warn("Monday capture failed:", err));

  // Proceed immediately — don't make user wait for Monday
  unlocked = true;
  revealTool();
});

function showError(msg) {
  gateNote.classList.add("gate__error");
  gateNote.querySelector("span").textContent = msg;
  submitBtn.textContent = "Unlock the tool";
  submitBtn.disabled = false;
}

function revealTool() {
  const gate = document.getElementById("gate");
  gate.classList.add("unlocked");
  gatedSection.classList.add("open");

  setTimeout(() => { gateSuccess.classList.add("show"); }, 480);

  setTimeout(() => {
    document.querySelectorAll(".gated .reveal").forEach((el) => el.classList.add("in"));
    runCounters();
    staggerRows();
    document.getElementById("stats").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 700);
}

/* ---------------- Count-up stats ---------------- */
let countersRun = false;
function runCounters() {
  if (countersRun) return;
  countersRun = true;
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = +el.dataset.count;
    const dur = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  });
}

/* ---------------- Stagger overlap rows ---------------- */
function staggerRows() {
  const rows = [...document.querySelectorAll(".row")];
  rows.forEach((row, i) => {
    setTimeout(() => row.classList.add("in"), 120 + i * 70);
  });
}

/* ---------------- Scroll reveals ---------------- */
function checkReveals() {
  const vh = window.innerHeight || document.documentElement.clientHeight;
  document.querySelectorAll(".reveal, .hl").forEach((el) => {
    if (el.classList.contains("in")) return;
    const rect = el.getBoundingClientRect();
    if (rect.height < 4) return;
    if (rect.top < vh * 0.9 && rect.bottom > 0) el.classList.add("in");
  });
}
window.addEventListener("scroll", checkReveals, { passive: true });
window.addEventListener("resize", checkReveals);
checkReveals();
requestAnimationFrame(checkReveals);
window.addEventListener("load", checkReveals);
setTimeout(checkReveals, 250);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(checkReveals);

buildHeroViz();

/* ---------------- Nav scroll state ---------------- */
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 30);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------------- Custom cursor ---------------- */
const dot  = document.querySelector(".cursor-dot");
const ring = document.querySelector(".cursor-ring");
let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

window.addEventListener("mousemove", (e) => {
  mx = e.clientX; my = e.clientY;
  dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
});
function ringLoop() {
  rx += (mx - rx) * 0.18;
  ry += (my - ry) * 0.18;
  ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
  requestAnimationFrame(ringLoop);
}
ringLoop();

const hotSel = "a, button, input, .role";
document.addEventListener("mouseover", (e) => {
  if (e.target.closest(hotSel)) ring.classList.add("hot");
});
document.addEventListener("mouseout", (e) => {
  if (e.target.closest(hotSel)) ring.classList.remove("hot");
});
