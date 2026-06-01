/* ============================================================
   Diagnostic — the seven screens
   ============================================================ */
const { useState: uS, useEffect: uE, useRef: uR } = React;

const GLYPH = (role, cx, cy, scale = 1.25) => {
  const segs = (window.ICON_PATHS[role] || "").split("|");
  return (
    <g transform={`translate(${cx},${cy}) scale(${scale}) translate(-12,-12)`}>
      {segs.map((d, i) => (
        <path key={i} d={d} stroke="var(--sage-dk)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </g>
  );
};

/* fracture glyph — recoiled cable tips + small snap-burst */
function Fracture() {
  return (
    <g transform="translate(150 73.7)">
      <g className="fracture">
        <path d="M-3 -6 L-8 0 L-3 6" stroke="var(--sage-dk)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 -6 L8 0 L3 6" stroke="var(--sage-dk)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="0" y1="-13" x2="0" y2="-9" stroke="var(--sage-dk)" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="0" y1="9" x2="0" y2="13" stroke="var(--sage-dk)" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="-12" y1="-9" x2="-15" y2="-12" stroke="var(--sage-dk)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        <line x1="12" y1="-9" x2="15" y2="-12" stroke="var(--sage-dk)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      </g>
    </g>
  );
}

function BreakDiagram({ cause }) {
  return (
    <svg viewBox="0 0 300 150">
      <rect className="rconnL" x="88" y="72.4" width="56" height="2.6" rx="1.3" fill="var(--sage)" />
      <rect className="rconnR" x="156" y="72.4" width="56" height="2.6" rx="1.3" fill="var(--sage)" />
      <Fracture />
      <g className="rnode">
        <circle cx="52" cy="73.7" r="34" fill="var(--cream)" stroke="var(--sage)" strokeWidth="1.5" />
        {GLYPH(cause.a.role, 52, 73.7, 1.3)}
      </g>
      <g className="rnode n2">
        <circle cx="248" cy="73.7" r="34" fill="var(--cream)" stroke="var(--sage)" strokeWidth="1.5" />
        {GLYPH(cause.b.role, 248, 73.7, 1.3)}
      </g>
      <text className="rlabel" x="52" y="128" textAnchor="middle">{cause.a.name}</text>
      <text className="rlabel" x="248" y="128" textAnchor="middle">{cause.b.name}</text>
    </svg>
  );
}

/* ============================================================
   SCREEN 1 — Landing / gate
   ============================================================ */
function Landing({ onContinue }) {
  const [logoErr, setLogoErr] = uS(false);
  return (
    <div className="screen s-land">
      <div className="body" style={{ justifyContent: "center" }}>
        <div className="inner">
          {logoErr
            ? <span className="logo-fallback">Flow Co.</span>
            : <img
                className="logo-img"
                src="https://flowco.ai/wp-content/uploads/2025/05/Flow-Co.-Logo-2.png"
                alt="Flow Co."
                onError={() => setLogoErr(true)}
              />
          }
          <h1>Who owns what.<br /><em>Where it breaks.</em></h1>
          <p className="sub">A marketing diagnostic for local service business owners.</p>
          <div className="fields">
            <label className="field"><Icon name="user" size={18} /><input placeholder="Name" /></label>
            <label className="field"><Icon name="company" size={18} /><input placeholder="Company" /></label>
            <label className="field"><Icon name="mail" size={18} /><input placeholder="Email" type="email" /></label>
            <button className="btn btn--sage" onClick={onContinue}>Continue <span className="arrow"><Icon name="arrow" size={18} sw={1.8} /></span></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SCREEN 2 + 3 — Symptom list + selection
   ============================================================ */
function SymptomScreen({ onReveal, onTeam }) {
  const [sel, setSel] = uS(null);
  const [mounted, setMounted] = uS(false);
  uE(() => { const t = setTimeout(() => setMounted(true), 30); return () => clearTimeout(t); }, []);
  return (
    <div className="screen s-symptom">
      <div className="topbar" style={{ paddingBottom: 4 }}>
        <Seg side="left" onLeft={() => {}} onRight={onTeam} />
      </div>
      <div className={`body ${mounted ? "in" : ""}`} style={{ paddingTop: 4 }}>
        {!sel && (
          <div className="head">
            <span className="eyebrow">Start where it hurts</span>
            <h2>Which of these sounds like your business?</h2>
          </div>
        )}
        <div className={`symlist ${sel ? "chosen" : ""}`}>
          {SYMPTOMS.map((s) => (
            <div key={s.id} className={`symrow ${sel === s.id ? "is-sel" : ""}`} onClick={() => !sel && setSel(s.id)}>
              <span className="txt">{s.text}</span>
              <span className="selcheck"><Icon name="check" size={15} sw={2.4} /></span>
              <span className="sellabel">Selected symptom</span>
              <span className="chev"><Icon name="chev" size={17} /></span>
            </div>
          ))}
        </div>
        {sel && (
          <div className="sel-cta">
            <button className="btn btn--sage" onClick={() => onReveal(sel)}>Show me where it breaks <span className="arrow"><Icon name="arrow" size={18} sw={1.8} /></span></button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SCREEN 4 — The reveal
   ============================================================ */
function RevealScreen({ symptom, onBack, onRole, onSymptom, onClose }) {
  const cause = REVEALS[symptom];
  const cls = useRevealSequence([symptom]);
  const [panelOpen, setPanelOpen] = uS(false);
  const [expandedRole, setExpandedRole] = uS(null);

  const toggleRow = (key) => setExpandedRole(prev => prev === key ? null : key);
  const roleNodes = [{ key: "a", node: cause.a }, { key: "b", node: cause.b }];

  return (
    <div className={`screen s-reveal ${cls}`}>
      <div className="topbar">
        <button className="iconbtn" onClick={onBack}><Icon name="back" size={22} /></button>
        <button className="iconbtn"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></button>
      </div>
      <div className="body">
        <div className="reveal-kick"><span>{cause.kick}</span></div>
        <div className="diagram"><BreakDiagram cause={cause} /></div>
        <p className="reveal-sentence">{cause.sentence}</p>

        <div className="reveal-explore">
          <button className="explore-link" onClick={() => { setPanelOpen(p => !p); setExpandedRole(null); }}>
            {panelOpen ? "Close" : "Explore the connection"} <Icon name={panelOpen ? "x" : "chevsm"} size={15} sw={2} />
          </button>
        </div>

        {panelOpen && (
          <div className="explore-panel">
            {roleNodes.map(({ key, node }) => {
              const isOpen = expandedRole === key;
              const seams = window.getSteamsForRole ? window.getSteamsForRole(node.role) : [];
              return (
                <div key={key} className={`ep-row${isOpen ? " ep-row--open" : ""}`}>
                  <div className="ep-row-head" onClick={() => toggleRow(key)}>
                    <span className="xrow-ic"><Icon name={node.role} size={20} /></span>
                    <span className="ep-row-main">
                      <span className="ep-row-name">{node.name}</span>
                      <span className="ep-row-scope">{ROLE_SCOPE[node.role]}</span>
                    </span>
                    <span className="chev" style={{ color: "var(--ink-35)", flex: "none", transition: "transform .25s", transform: isOpen ? "rotate(90deg)" : "none" }}>
                      <Icon name="chev" size={17} />
                    </span>
                  </div>
                  {isOpen && (
                    <div className="ep-row-body">
                      <p className="ep-quote">{ROLE_IN_SEAM[symptom][node.role]}</p>
                      {seams.length > 1 && (
                        <button className="ep-rabbit" onClick={() => { setPanelOpen(false); onRole(node.role); }}>
                          See {node.name}&rsquo;s other seams <Icon name="chevsm" size={13} sw={2} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="ep-related" onClick={() => onSymptom(cause.related)}>
              <span className="xrow-ic warn"><Icon name="warn" size={20} /></span>
              <span className="ep-row-main">
                <span className="ep-row-name serif">&ldquo;{SYM[cause.related]}&rdquo;</span>
                <span className="ep-row-scope">Related symptom &mdash; same seam</span>
              </span>
              <span className="chev" style={{ color: "var(--ink-35)", flex: "none" }}><Icon name="chev" size={17} /></span>
            </div>

            <div className="ep-cta">
              <button className="btn btn--sage" onClick={onClose}>
                This seam is one of many <span className="arrow"><Icon name="arrow" size={18} sw={1.8} /></span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SCREEN 6 — I have a team (multi-select)
   ============================================================ */
function TeamScreen({ onSymptomDoor, onProceed }) {
  const [sel, setSel] = uS(() => new Set());
  const toggle = (role) => setSel(prev => {
    const next = new Set(prev);
    if (next.has(role)) next.delete(role); else next.add(role);
    return next;
  });
  return (
    <div className="screen s-team">
      <div className="topbar" style={{ paddingBottom: 4 }}>
        <Seg side="right" onLeft={onSymptomDoor} onRight={() => {}} />
      </div>
      <div className="body scroll" style={{ paddingTop: 4 }}>
        <div className="head">
          <span className="eyebrow">Seven roles, one funnel</span>
          <h2>Which of these roles does your team own?</h2>
        </div>
        <div className="teamgrid">
          {TEAM.map((r, i) => (
            <div key={r.role}
              className={`rolecard ${i === 6 ? "full" : ""} ${sel.has(r.role) ? "sel" : ""}`}
              onClick={() => toggle(r.role)}>
              <span className="ic"><Icon name={r.role} size={32} sw={1.5} /></span>
              <span className="nm">{r.name}</span>
              {sel.has(r.role) && <span className="rc-check"><Icon name="check" size={13} sw={2.4} /></span>}
            </div>
          ))}
        </div>
        {sel.size > 0 && (
          <div className="sel-cta">
            <button className="btn btn--sage" onClick={() => onProceed(sel)}>
              See where it breaks <span className="arrow"><Icon name="arrow" size={18} sw={1.8} /></span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SCREEN 6b — Team result (connection + absence gaps)
   ============================================================ */
const ABSENCE_COPY = {
  tracking: {
    headline: "Missing Tracking",
    lead: "You’re spending without a scoreboard.",
    body: "The phone rings. A form comes in. A booking lands. But nothing ties any of it back to what caused it. So every budget decision is a guess — you keep paying for the channel that feels busy, not the one that’s working. The waste doesn’t show up on a report. It hides in the channels you can’t see.",
  },
  web: {
    headline: "Missing Web / dev",
    lead: "Your traffic lands somewhere nobody owns.",
    body: "The ads work. The clicks come. Then they hit a page that loads slow on mobile, buries the phone number, or routes a form into a void. You’re paying to send people to a door that sticks. Nobody owns the thing the whole funnel depends on — so the leak stays invisible while the spend keeps climbing.",
  },
  crm: {
    headline: "Missing CRM / follow-up",
    lead: "Leads come in and quietly leak out.",
    body: "Someone reaches out. They get a generic auto-reply, or nothing. No record gets created. No follow-up cadence fires. By the time anyone circles back — if anyone does — they’ve already booked the competitor who answered first. It looks like a lead-quality problem. It’s a follow-up problem.",
  },
  content: {
    headline: "Missing Content",
    lead: "Paid has nothing to stand on, and organic goes dark.",
    body: "Without someone making things, your ads run on stock photos and your feed goes quiet. There’s no proof, no story, nothing that makes a stranger trust you before the call. So paid works harder than it should to convert, and the free channel that compounds over time never gets built.",
  },
  seo: {
    headline: "Missing SEO / local",
    lead: "You’re invisible the moment someone searches.",
    body: "When a person types “near me” with their card already out, the businesses with a maintained Google Business Profile and a steady stream of fresh reviews win the map. Without someone owning local rank, your profile sits stale and your reviews trickle in too slow to matter. You’re not losing to better marketing — you’re losing to a competitor who shows up where you don’t.",
  },
};
const ABSENCE_PRIORITY = ["tracking", "web", "crm", "seo", "content"];

function TeamResultScreen({ selected, onSeam, onAbsenceRole, onBack, onClose }) {
  // Connection gaps: unique role-pair seams where both roles are selected, capped at 3
  const seenPairs = new Set();
  const connectionGaps = [];
  for (const sym of Object.keys(REVEALS)) {
    const s = REVEALS[sym];
    const pairKey = [s.a.role, s.b.role].sort().join("|");
    if (selected.has(s.a.role) && selected.has(s.b.role) && !seenPairs.has(pairKey)) {
      seenPairs.add(pairKey);
      connectionGaps.push({ symptom: sym, cause: s });
      if (connectionGaps.length === 3) break;
    }
  }

  // Absence gaps: headline roles NOT in selected, priority order, capped at 3
  const absenceGaps = ABSENCE_PRIORITY.filter(r => !selected.has(r)).slice(0, 3);

  return (
    <div className="screen s-team-result">
      <div className="topbar">
        <button className="iconbtn" onClick={onBack}><Icon name="back" size={22} /></button>
        <button className="iconbtn"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></button>
      </div>
      <div className="body scroll">

        {connectionGaps.length > 0 && (
          <div className="tr-section">
            <span className="eyebrow">Connection gaps</span>
            <p className="tr-section-sub">Seams between the roles you have</p>
            <div className="xrows" style={{ marginTop: 14 }}>
              {connectionGaps.map((g) => (
                <div key={g.symptom} className="xrow-item"
                  onClick={() => onSeam(g.symptom)}>
                  <span className="xrow-ic"><Icon name={g.cause.a.role} size={20} /></span>
                  <span className="xrow-main">
                    <span className="xr-name">{g.cause.kick}</span>
                    <span className="xr-sub">{g.cause.a.name} &amp; {g.cause.b.name}</span>
                  </span>
                  <span className="chev"><Icon name="chev" size={17} /></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {absenceGaps.length > 0 && (
          <div className={`tr-section${connectionGaps.length > 0 ? " tr-section--gap" : ""}`}>
            <span className="eyebrow">Absence gaps</span>
            <p className="tr-section-sub">What breaks when these roles aren&rsquo;t in the room</p>
            <div className="absence-list">
              {absenceGaps.map((role) => {
                const cp = ABSENCE_COPY[role];
                return (
                  <div key={role} className="absence-card" onClick={() => onAbsenceRole(role)}>
                    <div className="absence-head">
                      <span className="xrow-ic warn"><Icon name={role} size={20} /></span>
                      <div className="absence-head-txt">
                        <span className="ab-headline">{cp.headline}</span>
                        <span className="ab-lead">{cp.lead}</span>
                      </div>
                      <span className="chev" style={{ color: "var(--ink-35)", flexShrink: 0 }}><Icon name="chev" size={17} /></span>
                    </div>
                    <p className="ab-body">{cp.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: "auto", padding: "22px 0 26px", flexShrink: 0 }}>
          <button className="btn btn--sage" onClick={onClose}>
            This seam is one of many <span className="arrow"><Icon name="arrow" size={18} sw={1.8} /></span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SCREEN 7 — Closing + Calendly booking sheet
   ============================================================ */
const CALENDLY_SRC = "https://assets.calendly.com/assets/external/widget.js";

function ClosingScreen({ onBack }) {
  const [open, setOpen] = uS(false);

  uE(() => {
    if (!open) return;
    if (!document.querySelector(`script[src="${CALENDLY_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = CALENDLY_SRC; s.async = true;
      document.head.appendChild(s);
    } else if (window.Calendly) {
      window.Calendly.initInlineWidgets();
    }
  }, [open]);

  return (
    <div className="screen s-close">
      <div className="topbar">
        <button className="iconbtn" onClick={onBack}><Icon name="back" size={22} /></button>
      </div>
      <div className="body">
        <div className="close-check"><Icon name="check" size={26} sw={2} /></div>
        <h1>This is one seam.<br />We close all of them.</h1>
        <p className="sub">Flow Co. integrates the roles you already have &mdash; so every handoff is owned and every lead is traced.</p>
        <button className="btn btn--yellow" onClick={() => setOpen(true)}>Book a call <span className="arrow"><Icon name="arrow" size={18} sw={1.8} /></span></button>
      </div>

      <div className={`sheet-scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)}></div>
      <div className={`sheet ${open ? "show" : ""}`}>
        <div className="grip"></div>
        <div className="sheet-head">
          <h3>Book a call</h3>
          <button className="iconbtn" onClick={() => setOpen(false)}><Icon name="x" size={20} /></button>
        </div>
        <div className="sheet-scroll">
          <div
            className="calendly-inline-widget"
            data-url="https://calendly.com/flowcompany/growth-map"
            style={{ minWidth: "320px", height: "700px" }}
          />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Landing, SymptomScreen, RevealScreen, TeamScreen, TeamResultScreen, ClosingScreen });
