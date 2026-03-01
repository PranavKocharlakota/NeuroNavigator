import { useState, useEffect, useRef } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg: #0a0f1a;
    --bg2: #0f1726;
    --bg3: #14203a;
    --border: rgba(99, 179, 237, 0.15);
    --border-strong: rgba(99, 179, 237, 0.35);
    --accent: #e1a414;
    --accent2: #90cdf4;
    --accent-glow: rgba(99, 179, 237, 0.2);
    --green: #68d391;
    --green-dim: rgba(104, 211, 145, 0.15);
    --amber: #f6ad55;
    --amber-dim: rgba(246, 173, 85, 0.15);
    --red: #fc8181;
    --red-dim: rgba(252, 129, 129, 0.15);
    --text: #e2e8f0;
    --text-dim: #94a3b8;
    --text-faint: #475569;
    --font: 'Sora', sans-serif;
    --mono: 'JetBrains Mono', monospace;

  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--mono);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  /* Background grid */
  .app::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: 
      linear-gradient(rgba(99,179,237,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,179,237,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .app::after {
    content: '';
    position: fixed;
    top: -200px;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 500px;
    background: radial-gradient(ellipse, rgba(99,179,237,0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .container {
  position: relative;
  z-index: 1;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

  /* Header */
  .header {
    text-align: center;
    margin-bottom: 50px;
  }

  .logo-mark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;

  /* remove the bubble */
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;

  font-family: 'Space Grotesk', sans-serif;
  font-size: 55px;
  color: var(--accent);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

  .logo-dot {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  h1 {
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
    letter-spacing: -0.03em;
    line-height: 1.15;
    color: #fff;
    margin-bottom: 14px;
  }

  h1 span {
    background: linear-gradient(135deg, var(--accent) 0%, #b794f4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    color: var(--text-dim);
    font-size: 15px;
    max-width: 520px;
    margin: 0 auto;
    line-height: 1.7;
  }

  /* Card */
  .card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 24px;
    transition: border-color 0.2s;
  }

  .card:focus-within {
    border-color: var(--border-strong);
  }

  .section-label {
  font-family: var(--mono);
  font-size: 14px;          /* was 10px */
  letter-spacing: 0.10em;   /* was 0.15em */
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;                
}

  .section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* Form grid */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-grid.full { grid-template-columns: 1fr; }

  @media (max-width: 600px) {
    .form-grid { grid-template-columns: 1fr; }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-dim);
    letter-spacing: 0.02em;
  }

  input, select, textarea {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    color: var(--text);
    font-family: var(--font);
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  input:focus, select:focus, textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  input::placeholder, textarea::placeholder {
    color: var(--text-faint);
  }

  select option {
    background: var(--bg2);
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }

  /* Tag input */
  .tag-area {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px;
    min-height: 46px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    cursor: text;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .tag-area:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--bg3);
    border: 1px solid var(--border-strong);
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 12px;
    color: var(--accent2);
    font-family: var(--mono);
  }

  .tag-remove {
    cursor: pointer;
    color: var(--text-faint);
    font-size: 14px;
    line-height: 1;
    background: none;
    border: none;
    color: var(--text-dim);
  }

  .tag-remove:hover { color: var(--red); }

  .tag-input {
    flex: 1;
    min-width: 100px;
    background: none;
    border: none;
    box-shadow: none;
    padding: 4px 6px;
    font-size: 13px;
    color: var(--text);
    outline: none;
  }

  /* Performance status */
  .perf-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }

  @media (max-width: 500px) {
    .perf-grid { grid-template-columns: repeat(3, 1fr); }
  }

  .perf-btn {
    padding: 10px 0;
    text-align: center;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--font);
    font-size: 13px;
    color: var(--text-dim);
  }

  .perf-btn:hover {
    border-color: var(--border-strong);
    color: var(--text);
  }

  .perf-btn.active {
    background: var(--accent-glow);
    border-color: var(--accent);
    color: var(--accent);
    font-weight: 500;
  }

  .perf-label {
    font-size: 9px;
    font-family: var(--mono);
    letter-spacing: 0.05em;
    color: var(--text-faint);
    margin-top: 3px;
    display: block;
  }

  /* Submit button */
  .submit-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #ee8147 0%, #f95e46 100%);
    border: none;
    border-radius: 10px;
    color: white;
    font-family: var(--font);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    letter-spacing: 0.01em;
    position: relative;
    overflow: hidden;
  }

  .submit-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
  }

  .submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .submit-btn:active:not(:disabled) { transform: translateY(0); }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Loading state */
  .loading-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 48px 32px;
    text-align: center;
  }

  .spinner-ring {
    width: 48px;
    height: 48px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* keep the card centered, but force the steps list to be left-aligned */
.loading-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 360px;
  margin: 20px auto 0;

  align-items: flex-start;   /* left align rows */
  text-align: left;          /* left align wrapped lines */
}

.loading-step {
  display: flex;
  align-items: flex-start;   /* icon aligns to top of multi-line text */
  gap: 10px;
  width: 100%;
}

.step-icon {
  width: 18px;
  height: 18px;
  min-width: 18px;           /* prevents shifting */
  border-radius: 50%;
  border: 1px solid currentColor;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  flex-shrink: 0;
}

  .loading-step.active .step-icon {
    background: var(--accent-glow);
    animation: pulse 1.5s infinite;
  }

  /* colors for step states */
.loading-step.active {
  color: var(--accent);
}

.loading-step.done {
  color: var(--green);
}

.loading-step.done .step-icon {
  border-color: var(--green);
  color: var(--green);
}

  /* Results */
  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: gap;
    gap: 12px;
  }

  .results-title {
    font-size: 13px;
    color: var(--text-dim);
  }

  .results-count {
    font-family: var(--mono);
    font-size: 11px;
    padding: 4px 10px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 100px;
    color: var(--accent);
  }

  .trial-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 16px;
    transition: border-color 0.2s, transform 0.2s;
    cursor: pointer;
    animation: slideUp 0.4s ease both;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .trial-card:hover {
    border-color: var(--border-strong);
    transform: translateY(-2px);
  }

  .trial-card.expanded {
    border-color: var(--border-strong);
  }

  .trial-top {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .rank-badge {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--mono);
    font-size: 14px;
    font-weight: 500;
  }

  .rank-1 { background: rgba(246,173,85,0.2); color: var(--amber); border: 1px solid rgba(246,173,85,0.4); }
  .rank-2 { background: rgba(99,179,237,0.15); color: var(--accent); border: 1px solid var(--border-strong); }
  .rank-3 { background: rgba(104,211,145,0.15); color: var(--green); border: 1px solid rgba(104,211,145,0.3); }
  .rank-other { background: var(--bg3); color: var(--text-faint); border: 1px solid var(--border); }

  .trial-main { flex: 1; min-width: 0; }

  .trial-id {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--accent);
    letter-spacing: 0.08em;
    margin-bottom: 4px;
  }

  .trial-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .trial-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }

  .badge {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 6px;
    font-family: var(--mono);
    letter-spacing: 0.02em;
  }

  .badge-phase { background: var(--bg3); color: var(--text-dim); border: 1px solid var(--border); }
  .badge-match-high { background: var(--green-dim); color: var(--green); border: 1px solid rgba(104,211,145,0.25); }
  .badge-match-mid { background: var(--amber-dim); color: var(--amber); border: 1px solid rgba(246,173,85,0.25); }
  .badge-match-low { background: var(--red-dim); color: var(--red); border: 1px solid rgba(252,129,129,0.25); }
  .badge-type { background: rgba(183,148,244,0.1); color: #b794f4; border: 1px solid rgba(183,148,244,0.25); }

  .match-bar-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .match-label {
    font-size: 11px;
    color: var(--text-faint);
    white-space: nowrap;
  }

  .match-bar-bg {
    flex: 1;
    height: 4px;
    background: var(--bg3);
    border-radius: 100px;
    overflow: hidden;
  }

  .match-bar-fill {
    height: 100%;
    border-radius: 100px;
    transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

 .emoji-spinner {
  font-size: 44px;
  width: 56px;
  height: 56px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  /* straighten the test tube */
  transform: rotate(-45deg);

  animation: spinPause 2.4s ease-in-out infinite;
  transform-origin: center;

  filter: drop-shadow(0 0 10px rgba(225,164,20,0.25));
}

@keyframes spinPause {

  0% {
    transform: rotate(-45deg);
  }

  30% {
    transform: rotate(315deg);
  }

  50% {
    transform: rotate(315deg);
  }

  80% {
    transform: rotate(675deg);
  }

  100% {
    transform: rotate(675deg);
  }

}

  .match-pct {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--text-dim);
    min-width: 32px;
    text-align: right;
  }

  .expand-toggle {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-faint);
    transition: all 0.2s;
    font-size: 16px;
    line-height: 1;
  }

  .trial-card.expanded .expand-toggle {
    background: var(--accent-glow);
    border-color: var(--accent);
    color: var(--accent);
    transform: rotate(180deg);
  }

  .trial-detail {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    display: none;
  }

  .trial-card.expanded .trial-detail {
    display: block;
    animation: fadeIn 0.25s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  @media (max-width: 580px) {
    .detail-grid { grid-template-columns: 1fr; }
  }

  .detail-block h4 {
    font-size: 11px;
    font-family: var(--mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-faint);
    margin-bottom: 8px;
  }

  .detail-block p, .detail-block ul {
    font-size: 13px;
    color: var(--text-dim);
    line-height: 1.6;
  }

  .detail-block ul { padding-left: 16px; }
  .detail-block li { margin-bottom: 4px; }

  .reasoning-box {
    background: var(--bg);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 8px;
    padding: 14px 16px;
    font-size: 13px;
    color: var(--text-dim);
    line-height: 1.7;
    margin-top: 12px;
  }

  .reasoning-box strong {
    color: var(--accent);
    font-size: 10px;
    font-family: var(--mono);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    display: block;
    margin-bottom: 6px;
  }

  .trial-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    padding: 8px 14px;
    background: var(--bg3);
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    color: var(--accent);
    text-decoration: none;
    font-size: 12px;
    font-family: var(--mono);
    transition: all 0.15s;
  }

  .trial-link:hover {
    background: var(--accent-glow);
    border-color: var(--accent);
  }

  /* Disclaimer */
  .disclaimer {
    margin-top: 32px;
    padding: 16px 20px;
    background: rgba(246,173,85,0.05);
    border: 1px solid rgba(246,173,85,0.2);
    border-radius: 10px;
    font-size: 12px;
    color: var(--text-faint);
    line-height: 1.6;
    display: flex;
    gap: 12px;
  }

  .disclaimer-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

  .reset-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-dim);
    font-family: var(--font);
    font-size: 13px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .reset-btn:hover {
    border-color: var(--border-strong);
    color: var(--text);
  }

  .error-box {
    background: var(--red-dim);
    border: 1px solid rgba(252,129,129,0.3);
    border-radius: 10px;
    padding: 16px 20px;
    color: var(--red);
    font-size: 14px;
    margin-bottom: 20px;
  }

@keyframes fadeDown {
  from { 
    opacity: 0;
    transform: translateY(-20px); /* start above */
  }
  to { 
    opacity: 1;
    transform: translateY(0); /* move into place */
  }
}

.fade-in {
  opacity: 0;
  animation: fadeDown 700ms ease-out forwards;
}
`;

function TrialsMap({ trials, apiKey }) {
  const mapRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey || loaded) return;
    if (window.google && window.google.maps) { setLoaded(true); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 4,
      center: { lat: 39.5, lng: -98.35 },
      mapTypeId: "roadmap",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0f1726" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0a0f1a" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#14203a" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a0f1a" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
      ],
    });

    let openInfo = null;

    trials.forEach((trial, ti) => {
      const score = trial.matchScore || 0;
      const color = score >= 80 ? "#68d391" : score >= 60 ? "#f6ad55" : score >= 40 ? "#fc8181" : "#b794f4";
      (trial.sites || []).forEach(site => {
        if (!site.lat || !site.lng) return;
        const marker = new window.google.maps.Marker({
          position: { lat: site.lat, lng: site.lng },
          map,
          title: site.facility,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: "#0a0f1a",
            strokeWeight: 2,
          },
        });
        const info = new window.google.maps.InfoWindow({
          content: `
            <div style="background:#0f1726;color:#e2e8f0;padding:12px 14px;border-radius:8px;font-family:monospace;font-size:12px;max-width:240px">
              <div style="color:${color};font-size:10px;margin-bottom:4px">#${trial.matchScore}%/div>
              <div style="font-weight:600;margin-bottom:4px;font-size:13px">${trial.nctId}</div>
              <div style="color:#e2e8f0;margin-bottom:6px;font-family:sans-serif;font-size:12px">${trial.name}</div>
              <div style="color:#94a3b8">${site.facility}</div>
              <div style="color:#94a3b8">${site.city}${site.state ? ", " + site.state : ""}</div>
            </div>
          `,
        });
        marker.addListener("click", () => {
          if (openInfo) openInfo.close();
          openInfo = info;
          info.open(map, marker);
        });
      });
    });
  }, [loaded, trials]);

  return (
    <div ref={mapRef} style={{
      width: "100%",
      height: "85vh",
      borderRadius: "12px",
      border: "1px solid rgba(99,179,237,0.15)",
      background: "#0f1726",
    }} />
  );
}


const performanceLabels = ["Fully active", "Restricted strenuous", "Ambulatory, selfcare", "Limited selfcare", "Completely disabled"];

function TagInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState("");

  const addTag = (raw) => {
    const parts = raw.split(/[,;]+/).map(t => t.trim()).filter(Boolean);
    if (parts.length) onChange([...value, ...parts.filter(p => !value.includes(p))]);
    setInput("");
  };

  const handleKey = (e) => {
    if (["Enter", ",", "Tab"].includes(e.key)) {
      e.preventDefault();
      if (input.trim()) addTag(input);
    } else if (e.key === "Backspace" && !input && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="tag-area" onClick={e => e.currentTarget.querySelector("input").focus()}>
      {value.map(tag => (
        <span key={tag} className="tag">
          {tag}
          <button className="tag-remove" onClick={() => onChange(value.filter(t => t !== tag))}>×</button>
        </span>
      ))}
      <input
        className="tag-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={value.length ? "" : placeholder}
      />
    </div>
  );
}

function MatchBar({ score }) {
  const color = score >= 80 ? "#68d391" : score >= 60 ? "#f6ad55" : "#fc8181";
  const badgeClass = score >= 80 ? "badge-match-high" : score >= 60 ? "badge-match-mid" : "badge-match-low";
  return (
    <div className="match-bar-row">
      <span className="match-label">Match</span>
      <div className="match-bar-bg">
        <div className="match-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="match-pct">{score}%</span>
    </div>
  );
}

function TrialCard({ trial, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const rankClass = trial.rank <= 3 ? `rank-${trial.rank}` : "rank-other";
  const badgeClass = trial.matchScore >= 80 ? "badge-match-high" : trial.matchScore >= 60 ? "badge-match-mid" : "badge-match-low";

  return (
    <div
      className={`trial-card ${expanded ? "expanded" : ""}`}
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="trial-top">
        <div className={`rank-badge ${rankClass}`}>#{trial.rank}</div>
        <div className="trial-main">
          <div className="trial-id">{trial.nctId}</div>
          <div className="trial-name">{trial.name}</div>
          <div className="trial-tags">
            <span className="badge badge-phase">{trial.phase}</span>
            <span className="badge badge-type">{trial.type}</span>
            <span className={`badge ${badgeClass}`}>{trial.matchScore >= 80 ? "Strong Match" : trial.matchScore >= 60 ? "Possible Match" : "Partial Match"}</span>
          </div>
          <MatchBar score={trial.matchScore} />
        </div>
        <div className="expand-toggle">▾</div>
      </div>

      <div className="trial-detail">
        <div className="detail-grid">
          <div className="detail-block">
            <h4>Key Eligibility</h4>
            <ul>{trial.eligibilitySummary.map(e => <li key={e}>{e}</li>)}</ul>
          </div>
          <div className="detail-block">
            <h4>Mechanism</h4>
            <p>{trial.mechanism}</p>
          </div>
          <div className="detail-block">
            <h4>Sites & Status</h4>
            <p>{trial.location}<br /><span style={{color: "var(--green)", fontSize: 12}}>● {trial.status}</span></p>
          </div>
          <div className="detail-block">
            <h4>Timeline</h4>
            <p>{trial.keyDates}</p>
          </div>
        </div>
        <div className="reasoning-box">
          <strong>Why this trial matches your profile</strong>
          {trial.reasoning}
        </div>
        <a
          href={`https://clinicaltrials.gov/study/${trial.nctId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="trial-link"
          onClick={e => e.stopPropagation()}
        >
          View on ClinicalTrials.gov ↗
        </a>
      </div>
    </div>
  );
}

const LOADING_STEPS = [
  "Parsing tumor molecular profile",
  "Querying ClinicalTrials.gov database",
  "Running eligibility matching",
  "Ranking by fit & evidence strength",
  "Generating plain-language explanations"
];

export default function App() {
  const DIAGNOSIS_MAP = { GBM: "GBM", AA: "Astrocytoma", AO: "Oligodendroglioma", DIPG: "DIPG", Meningioma: "Other", Medulloblastoma: "Other", Other: "Other" };
  const VALID_TREATMENTS = new Set(["Surgery", "Radiation", "Temozolomide", "Bevacizumab", "Immunotherapy", "Lomustine", "Other"]);

  const [form, setForm] = useState({
    age: "",
    zipcode: "",
    diagnosis: "GBM",
    grade: "4",
    tumorStatus: "newly_diagnosed",
    idh: "wildtype",
    mgmt: "unmethylated",
    mutations: [],
    priorTreatments: [],
    ecog: null,
    additionalNotes: ""
  });

  const [phase, setPhase] = useState("form"); // form | loading | results | error
  const [loadingStep, setLoadingStep] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [mapsKey, setMapsKey] = useState("");

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    setPhase("loading");
    setLoadingStep(0);

    // Animate steps concurrently with the real API call
    let step = 0;
    const stepTimer = setInterval(() => {
      step = Math.min(step + 1, LOADING_STEPS.length - 1);
      setLoadingStep(step);
    }, 2500);

    try {
      const payload = {
        age: parseInt(form.age, 10),
        zipCode: form.zipcode || null,
        diagnosis: DIAGNOSIS_MAP[form.diagnosis] || "Other",
        grade: parseInt(form.grade, 10),
        tumorStatus: form.tumorStatus,
        idh: form.idh,
        mgmt: form.mgmt,
        mutations: form.mutations,
        priorTreatments: [...new Set(
          form.priorTreatments.map(t => VALID_TREATMENTS.has(t) ? t : "Other")
        )],
        ecog: form.ecog,
        additionalNotes: form.additionalNotes || null,
      };

      const API = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${API}/rank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      clearInterval(stepTimer);
      setLoadingStep(LOADING_STEPS.length);

      if (!res.ok) {
        const errText = await res.text();
        setError(errText);
        setPhase("error");
        return;
      }

      const data = await res.json();
      const trials = (data.rankedTrials || []).map((t, i) => ({
        rank: t.rank ?? i + 1,
        nctId: t.nctId,
        name: t.name,
        phase: t.phase || "N/A",
        type: t.type || "Clinical Trial",
        matchScore: t.matchScore,
        location: t.location || "Multiple Sites",
        status: t.status || "Recruiting",
        eligibilitySummary: t.eligibilitySummary || [],
        mechanism: t.mechanism || "",
        keyDates: t.keyDates || "",
        reasoning: t.patientExplanation || "",
        sites: t.sites || [],
      }));

      setResults(trials);
      setPhase("results");
    } catch (e) {
      clearInterval(stepTimer);
      setError(e.message || "Connection error. Is the backend running on port 8000?");
      setPhase("error");
    }
  };

  const canSubmit = form.age && form.diagnosis && form.ecog !== null;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="container">
          <div className="header fade-in">
            <div className="logo-mark">
              <span className="logo-dot">🧠</span> 
              NeuroNavigator
            </div>
            <h1>Find Clinical Trials<br />Matched to <span>Your Profile</span></h1>
            <p className="subtitle">
              Tell us a bit about your diagnosis. We’ll look through active trials and highlight the ones you may qualify for to help guide your conversation with your oncologist.
            </p>
          </div>

          {phase === "form" && (
            <>
              {/* Basic Info */}
              <div className="card fade-in">
                <div className="section-label">Patient & Tumor Basics</div>
                <div className="form-grid">
                  <div className="field">
                    <label>Age</label>
                    <input type="number" placeholder="e.g. 54" value={form.age} onChange={e => set("age", e.target.value)} min={18} max={100} />
                  </div>
                  <div className="field">
                    <label>Primary Diagnosis</label>
                    <select value={form.diagnosis} onChange={e => set("diagnosis", e.target.value)}>
                      <option value="GBM">Glioblastoma (GBM)</option>
                      <option value="AA">Anaplastic Astrocytoma (AA)</option>
                      <option value="AO">Anaplastic Oligodendroglioma</option>
                      <option value="DIPG">DIPG</option>
                      <option value="Meningioma">Meningioma</option>
                      <option value="Medulloblastoma">Medulloblastoma</option>
                      <option value="Other">Other Brain Tumor</option>
                    </select>
                  </div>
                  <div className="field">
                  <label>Zip Code</label>
                  <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d{5}"
                      maxLength={5}
                      placeholder="e.g. 92612"
                      value={form.zipcode}
                      onChange={(e) => set("zipcode", e.target.value.replace(/\D/g, "").slice(0, 5))}
                    />
                  </div>
                  <div className="field">
                    <label>WHO Grade</label>
                    <select value={form.grade} onChange={e => set("grade", e.target.value)}>
                      <option value="1">Grade 1</option>
                      <option value="2">Grade 2</option>
                      <option value="3">Grade 3</option>
                      <option value="4">Grade 4</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Tumor Status</label>
                    <select value={form.tumorStatus} onChange={e => set("tumorStatus", e.target.value)}>
                      <option value="newly_diagnosed">Newly Diagnosed</option>
                      <option value="recurrent">Recurrent</option>
                    </select>
                  </div>
                  </div>
                </div>

              {/* Molecular Markers */}
              <div className="card fade-in">
                <div className="section-label">Molecular Markers & Mutations</div>
                <div className="form-grid full">
                  <div className="field">
                    <label>Known Mutations / Alterations (press Enter or comma to add)</label>
                    <TagInput
                      value={form.mutations}
                      onChange={v => set("mutations", v)}
                      placeholder="e.g. BRAF V600E, EGFR amplification, TERT promoter..."
                    />
                  </div>
                  <div className="field">
                    <label>IDH Status</label>
                    <select value={form.idh} onChange={e => set("idh", e.target.value)}>
                      <option value="wildtype">IDH Wildtype</option>
                      <option value="mutant">IDH Mutant</option>
                      <option value="unknown">Unknown / Not Tested</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>MGMT Methylation</label>
                    <select value={form.mgmt} onChange={e => set("mgmt", e.target.value)}>
                      <option value="unmethylated">Unmethylated</option>
                      <option value="methylated">Methylated</option>
                      <option value="unknown">Unknown / Not Tested</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Treatment History */}
              <div className="card fade-in">
                <div className="section-label">Treatment History</div>
                <div className="form-grid full">
                  <div className="field">
                    <label>Prior Treatments (press Enter or comma to add)</label>
                    <TagInput
                      value={form.priorTreatments}
                      onChange={v => set("priorTreatments", v)}
                      placeholder="e.g. Temozolomide, Radiation, Bevacizumab, Surgery..."
                    />
                  </div>
                </div>
              </div>

              {/* Performance Status */}
              <div className="card fade-in">
                <div className="section-label">Performance Status (ECOG)</div>
                <div className="perf-grid">
                  {[0,1,2,3,4].map(score => (
                    <button
                      key={score}
                      className={`perf-btn ${form.ecog === score ? "active" : ""}`}
                      onClick={() => set("ecog", score)}
                    >
                      {score}
                      <span className="perf-label">{performanceLabels[score]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="card fade-in">
                <div className="section-label">Additional Context (optional)</div>
                <div className="field">
                  <label>Any other relevant details (e.g. prior radiation field, allergies, recurrence info)</label>
                  <textarea
                    value={form.additionalNotes}
                    onChange={e => set("additionalNotes", e.target.value)}
                    placeholder="e.g. Recurrent after Stupp protocol, unable to travel more than 100 miles..."
                  />
                </div>
              </div>

              <button className="submit-btn" onClick={handleSubmit} disabled={!canSubmit}>
                {canSubmit ? "Find Matching Trials →" : "Complete required fields to continue"}
              </button>
            </>
          )}

          {phase === "loading" && (
            <div className="loading-card">
            <div className="emoji-spinner">🧪</div>
            <div style={{color: "var(--text)", fontWeight: 600, fontSize: 16}}>Analyzing your profile...</div>
              <div style={{color: "var(--text-dim)", fontSize: 13, marginTop: 6}}>Searching active brain cancer trials</div>
              <div className="loading-steps">
                {LOADING_STEPS.map((step, i) => (
                  <div key={i} className={`loading-step ${i < loadingStep ? "done" : i === loadingStep ? "active" : ""}`}>
                    <div className="step-icon">
                      {i < loadingStep ? "✓" : i + 1}
                    </div>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === "error" && (
            <>
              <div className="error-box">⚠ {error || "Something went wrong. Please try again."}</div>
              <button className="reset-btn" onClick={() => { setPhase("form"); setError(""); }}>← Back to form</button>
            </>
          )}

          {phase === "results" && (
            <>
              <div className="results-header">
                <div>
                  <div style={{fontWeight: 600, fontSize: 18, marginBottom: 2}}>Matched Clinical Trials</div>
                  <div className="results-title">Ranked by eligibility fit · Click any trial to expand details</div>
                </div>
                <div style={{display:"flex", gap:10, alignItems:"center"}}>
                  <span className="results-count">{results.length} found</span>
                  <button className="reset-btn" onClick={() => setPhase("form")}>← Edit Profile</button>
                </div>
              </div>

              {results.map((trial, i) => (
                <TrialCard key={trial.nctId} trial={trial} index={i} />
              ))}

              <button
                className="reset-btn"
                style={{ width: "100%", marginBottom: 16, justifyContent: "center" }}
                onClick={async () => {
                  if (!mapsKey) {
                    const res = await fetch(`${import.meta.env.VITE_API_URL || "/api"}/maps-key`);
                    const data = await res.json();
                    setMapsKey(data.key);
                  }
                  setPhase("map");
                }}
              >
                Show Trials on Map
              </button>

              <div className="disclaimer">
                <span className="disclaimer-icon">⚕</span>
                <span>
                  <strong style={{color: "var(--amber)", fontWeight: 600}}>For discussion with your care team only.</strong> This tool uses AI-assisted matching and may not reflect every eligibility criterion or the latest trial status. Always verify with ClinicalTrials.gov and confirm with your neuro-oncologist before pursuing any trial.
                </span>
              </div>
            </>
          )}
          {phase === "map" && (
            <div style={{ position: "relative" }}>
              <TrialsMap trials={results} apiKey={mapsKey} />
              <div style={{
                position: "absolute", bottom: 24, left: 24, zIndex: 10,
                display: "flex", flexDirection: "column", alignItems: "stretch", gap: 10,
              }}>
                <div style={{
                  background: "#0f1726", border: "1px solid rgba(99,179,237,0.25)",
                  borderRadius: 10, padding: "10px 12px", fontFamily: "monospace",
                  fontSize: 11, color: "#94a3b8", lineHeight: 2,
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}>
                  <div style={{ color: "#e2e8f0", fontWeight: 600, marginBottom: 6, fontSize: 12 }}>Legend</div>
                  <div><span style={{ color: "#68d391" }}>●</span> &nbsp;80–100%</div>
                  <div><span style={{ color: "#f6ad55" }}>●</span> &nbsp;60–79%</div>
                  <div><span style={{ color: "#fc8181" }}>●</span> &nbsp;40–59%</div>
                  <div><span style={{ color: "#b794f4" }}>●</span> &nbsp;&lt;40%</div>
                </div>
                <button
                  className="reset-btn"
                  style={{ background: "var(--bg2)", borderColor: "var(--border-strong)", justifyContent: "center", width: "100%" }}
                  onClick={() => setPhase("results")}
                >
                  ← Back to Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
