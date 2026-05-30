/* ============================================================
   Diagnostic — core: data, icons, motion hooks, shared UI
   Exports to window.
   ============================================================ */
const { useState, useEffect, useRef } = React;

/* ---------------- icons (line-art, stroke = currentColor) ---------------- */
const ICON_PATHS = {
  paid:    "M4 10v4h3l9 4V6L7 10H4z|M19.5 9a3.5 3.5 0 0 1 0 6",
  seo:     "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z|M15.5 15.5 20 20",
  content: "M4 20h4L19.5 8.5l-4-4L4 16v4z|M14 6l4 4",
  web:     "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z|M3.5 12h17|M12 3c2.8 2.6 2.8 13.4 0 18|M12 3c-2.8 2.6-2.8 13.4 0 18",
  crm:     "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M3.5 19a5.5 5.5 0 0 1 11 0|M16 5.2a3 3 0 0 1 0 5.6|M17.5 13.8A5.5 5.5 0 0 1 20.5 19",
  tracking:"M5 19V12|M10 19V6|M15 19V10|M20 19V14|M3.5 19h17",
  reputation:"M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9z",
  check:   "M5 12.5l4.2 4L19 6.5",
  chev:    "M9.5 6l6 6-6 6",
  chevsm:  "M8 5l5 5-5 5",
  back:    "M15 6l-6 6 6 6",
  arrow:   "M4 12h15|M13.5 6l6 6-6 6",
  x:       "M6 6l12 12|M18 6 6 18",
  user:    "M12 12a3.6 3.6 0 1 0 0-7.2A3.6 3.6 0 0 0 12 12z|M5 20a7 7 0 0 1 14 0",
  company: "M5 21V4.6a.6.6 0 0 1 .6-.6h7.8a.6.6 0 0 1 .6.6V21|M14 9h4.4a.6.6 0 0 1 .6.6V21|M8 8h2.5|M8 12h2.5|M8 16h2.5|M3.5 21h17",
  mail:    "M3.5 6.5h17v11h-17z|M4 7l8 6 8-6",
  warn:    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z|M12 8v5|M12 16.3v.01",
};
function Icon({ name, size = 24, sw = 1.6, style }) {
  const segs = (ICON_PATHS[name] || "").split("|");
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {segs.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

function LogoMark({ size = 74 }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 74 74" fill="none">
      <circle cx="37" cy="37" r="35" stroke="var(--sage)" strokeWidth="1.4" />
      <path d="M24 47V28l13 12 13-12v19" stroke="var(--black)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* ---------------- data ---------------- */
const SYMPTOMS = [
  { id: "ring",  text: "The phone rings but I don\u2019t know what\u2019s making it ring" },
  { id: "book",  text: "Leads come in but never book" },
  { id: "prove", text: "We spend money on marketing but can\u2019t prove what works" },
  { id: "site",  text: "My website exists but doesn\u2019t seem to help." },
];
const SYM = Object.fromEntries(SYMPTOMS.map((s) => [s.id, s.text]));

const REVEALS = {
  ring: { causes: [
    { kick: "Attribution Break", a: { role: "paid", name: "Paid Media" }, b: { role: "tracking", name: "Tracking" },
      sentence: "The phone rings, but nothing ties the call back to the click that caused it.", related: "prove" },
  ]},
  book: { causes: [
    { kick: "Attribution Break", a: { role: "paid", name: "Paid Media" }, b: { role: "tracking", name: "Tracking" },
      sentence: "Clicks are coming in, but the handoff into measurable conversion tracking is incomplete.", related: "prove" },
    { kick: "Form-to-CRM Break", a: { role: "web", name: "Web" }, b: { role: "crm", name: "CRM" },
      sentence: "The form submits, but no record is created and no follow-up ever fires.", related: "site" },
  ]},
  prove: { causes: [
    { kick: "Closed-Loop Break", a: { role: "tracking", name: "Tracking" }, b: { role: "crm", name: "CRM" },
      sentence: "Spend goes out and leads come in, but the two never reconcile. ROAS stays a guess.", related: "book" },
  ]},
  site: { causes: [
    { kick: "Conversion Break", a: { role: "web", name: "Web" }, b: { role: "content", name: "Content" },
      sentence: "Traffic lands on a page built to inform, not convert. The path to contact is missing.", related: "book" },
  ]},
};

const TEAM = [
  { role: "paid", name: "Paid" }, { role: "seo", name: "SEO" },
  { role: "content", name: "Content" }, { role: "web", name: "Web" },
  { role: "crm", name: "CRM" }, { role: "tracking", name: "Tracking" },
  { role: "reputation", name: "Reputation" },
];
const ROLE_SCOPE = {
  paid: "Spend · targeting · bidding", seo: "Rankings · GBP · citations",
  content: "Organic · video · email", web: "Pages · speed · forms",
  crm: "Pipeline · follow-up · routing", tracking: "Pixels · UTMs · events",
  reputation: "Reviews · GBP · response",
};

/* ---------------- shared chrome ---------------- */
function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:41</span>
      <span className="sb">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="7.5" width="3" height="4.5" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2.5" width="3" height="9.5" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 4.4C3.1 2.1 5.4 1 8 1s4.9 1.1 7 3.4M3.4 6.8C4.7 5.4 6.3 4.7 8 4.7s3.3.7 4.6 2.1M5.8 9.2c.6-.6 1.4-1 2.2-1s1.6.4 2.2 1"/></svg>
        <svg width="26" height="13" viewBox="0 0 26 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.2" stroke="currentColor" opacity="0.45"/><rect x="2" y="2" width="17" height="9" rx="1.8" fill="currentColor"/><rect x="23.5" y="4" width="1.8" height="5" rx="0.9" fill="currentColor" opacity="0.45"/></svg>
      </span>
    </div>
  );
}

function Seg({ side, onLeft, onRight }) {
  return (
    <div className={`seg ${side === "right" ? "right" : ""}`}>
      <div className="seg__thumb"></div>
      <button className={side === "left" ? "on" : ""} onClick={onLeft}>I have a symptom</button>
      <button className={side === "right" ? "on" : ""} onClick={onRight}>I have a team</button>
    </div>
  );
}

/* ---------------- reveal motion hook ----------------
   Accumulates phase classes once on mount / when deps change:
   r-on (nodes settle) → r-form (lines draw) → r-break (recoil+fracture) → r-named (highlight+text) */
function useRevealSequence(deps) {
  const [cls, setCls] = useState("");
  useEffect(() => {
    setCls("");
    const t = [];
    t.push(setTimeout(() => setCls("r-on"), 140));
    t.push(setTimeout(() => setCls("r-on r-form"), 140 + 640));
    t.push(setTimeout(() => setCls("r-on r-form r-break"), 140 + 640 + 720));
    t.push(setTimeout(() => setCls("r-on r-form r-break r-named"), 140 + 640 + 720 + 660));
    return () => t.forEach(clearTimeout);
  }, deps);
  return cls;
}

Object.assign(window, {
  Icon, LogoMark, ICON_PATHS, SYMPTOMS, SYM, REVEALS, TEAM, ROLE_SCOPE,
  StatusBar, Seg, useRevealSequence,
});
