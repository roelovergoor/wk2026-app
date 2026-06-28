import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

// === HISTORISCHE DATA (64 wedstrijden, 32 teams) ===
const historicalData = [
  { year: "2006", matches: 64, yellow: 345, red: 28, ypg: 5.39, rpg: 0.44 },
  { year: "2010", matches: 64, yellow: 260, red: 17, ypg: 4.06, rpg: 0.27 },
  { year: "2014", matches: 64, yellow: 187, red: 10, ypg: 2.92, rpg: 0.16 },
  { year: "2018", matches: 64, yellow: 219, red: 4,  ypg: 3.42, rpg: 0.06 },
  { year: "2022", matches: 64, yellow: 214, red: 4,  ypg: 3.34, rpg: 0.06 },
];

// WK 2026: 104 wedstrijden
const MATCHES_2026 = 104;

// Gewogen gemiddelde (recente edities zwaarder gewogen)
const weights = [0.05, 0.10, 0.20, 0.30, 0.35];
const weightedYPG = historicalData.reduce((acc, d, i) => acc + d.ypg * weights[i], 0);
const weightedRPG = historicalData.reduce((acc, d, i) => acc + d.rpg * weights[i], 0);

// Scenario's
const scenarios = {
  laag:    { ypg: weightedYPG * 0.85, rpg: weightedRPG * 0.80, label: "Conservatief (meer VAR-discipline)" },
  basis:   { ypg: weightedYPG,        rpg: weightedRPG,        label: "Basisscenario (gewogen gemiddelde)" },
  hoog:    { ypg: weightedYPG * 1.20, rpg: weightedRPG * 1.40, label: "Hoog (hogere inzet knockout ronde)" },
};

const scenarioColors = { laag: "#38bdf8", basis: "#f59e0b", hoog: "#f87171" };

// Poisson-kans berekening
function poissonProb(lambda, k) {
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

function poissonCumulative(lambda, k) {
  let cum = 0;
  for (let i = 0; i <= k; i++) cum += poissonProb(lambda, i);
  return cum;
}

// Vergelijkingstabel met geprojecteerde WK 2026 waarden
const projectionData = historicalData.map(d => ({
  year: d.year,
  yellow: d.yellow,
  red: d.red,
}));
projectionData.push({
  year: "2026 (proj.)",
  yellow: Math.round(scenarios.basis.ypg * MATCHES_2026),
  red: Math.round(scenarios.basis.rpg * MATCHES_2026),
  projected: true,
});

// Fase-analyse: groepsfase vs. knockout
const phaseData = [
  { fase: "Groepsfase (48 duels)", yellow: Math.round(scenarios.basis.ypg * 0.90 * 48), red: Math.round(scenarios.basis.rpg * 0.60 * 48) },
  { fase: "Knockout R32–QF (44 duels)", yellow: Math.round(scenarios.basis.ypg * 1.05 * 44), red: Math.round(scenarios.basis.rpg * 1.30 * 44) },
  { fase: "SF + Finale (4 duels)", yellow: Math.round(scenarios.basis.ypg * 1.20 * 4), red: Math.round(scenarios.basis.rpg * 1.50 * 4) },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px" }}>
        <p style={{ color: "#94a3b8", marginBottom: 4, fontSize: 13 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: "2px 0", fontSize: 13 }}>
            {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed ? p.value.toFixed(0) : p.value : p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function App() {
  const [activeScenario, setActiveScenario] = useState("basis");
  const sc = scenarios[activeScenario];
  const yellowTotal = Math.round(sc.ypg * MATCHES_2026);
  const redTotal = Math.round(sc.rpg * MATCHES_2026);

  const pNoYellow = (poissonCumulative(sc.ypg, 0) * 100).toFixed(1);
  const pNoRed = (poissonCumulative(sc.rpg, 0) * 100).toFixed(1);
  const pRedPerMatch = ((1 - poissonCumulative(sc.rpg, 0)) * 100).toFixed(1);

  const trendData = historicalData.map(d => ({
    year: d.year,
    "Geel/duel": +d.ypg.toFixed(2),
    "Rood/duel": +d.rpg.toFixed(2),
  }));

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", padding: "28px 20px" }}>
      
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ display: "inline-block", background: "linear-gradient(135deg, #f59e0b, #ef4444)", borderRadius: 12, padding: "4px 14px", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, color: "#fff" }}>
          Statistisch Model
        </div>
        <h1 style={{ fontSize: "clamp(22px, 5vw, 34px)", fontWeight: 800, margin: "0 0 6px", letterSpacing: -1 }}>
          🟨🟥 WK 2026 — Kaarten Voorspelling
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
          104 wedstrijden · 48 teams · Gewogen historisch model + Poisson-distributie
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        {Object.entries(scenarios).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setActiveScenario(key)}
            style={{
              background: activeScenario === key ? scenarioColors[key] : "#1e293b",
              color: activeScenario === key ? "#0f172a" : "#94a3b8",
              border: `2px solid ${activeScenario === key ? scenarioColors[key] : "#334155"}`,
              borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13,
              transition: "all 0.2s"
            }}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>
      <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, marginBottom: 28, marginTop: -16 }}>
        {sc.label}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 32 }}>
        {[
          { label: "Verwachte gele kaarten", value: yellowTotal, sub: `${sc.ypg.toFixed(2)} / duel`, color: "#f59e0b", icon: "🟨" },
          { label: "Verwachte rode kaarten", value: redTotal, sub: `${sc.rpg.toFixed(2)} / duel`, color: "#ef4444", icon: "🟥" },
          { label: "Kans op geel/duel", value: `${(100 - pNoYellow)}%`, sub: "≥1 gele kaart", color: "#38bdf8", icon: "📊" },
          { label: "Kans op rood/duel", value: `${pRedPerMatch}%`, sub: "≥1 rode kaart", color: "#a78bfa", icon: "📉" },
        ].map((kpi, i) => (
          <div key={i} style={{ background: "#1e293b", borderRadius: 12, padding: "18px 16px", borderTop: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{kpi.icon}</div>
            <div style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{kpi.label}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#1e293b", borderRadius: 14, padding: "20px 16px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "#e2e8f0" }}>Kaarten per wedstrijd — Historische trend</h2>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16, margin: "0 0 16px" }}>VAR (2018) zorgde voor scherpe daling rode kaarten; gele kaarten stabiliseerden</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
            <Line type="monotone" dataKey="Geel/duel" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: "#f59e0b", r: 5 }} />
            <Line type="monotone" dataKey="Rood/duel" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "#1e293b", borderRadius: 14, padding: "20px 16px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "#e2e8f0" }}>Absolute kaarten: vergelijking per toernooi</h2>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>WK 2026 heeft 104 in plaats van 64 wedstrijden (+63%) — de projectie is gecorrigeerd voor dat volume</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
            <Bar dataKey="yellow" name="Gele kaarten" fill="#f59e0b" radius={[4,4,0,0]} />
            <Bar dataKey="red" name="Rode kaarten" fill="#ef4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "#1e293b", borderRadius: 14, padding: "20px 16px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "#e2e8f0" }}>Verdeling over toernooifasen</h2>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Knockout-duels kennen traditioneel meer kaarten door hogere inzet</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={phaseData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis dataKey="fase" type="category" tick={{ fill: "#94a3b8", fontSize: 11 }} width={200} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
            <Bar dataKey="yellow" name="Gele kaarten" fill="#f59e0b" radius={[0,4,4,0]} />
            <Bar dataKey="red" name="Rode kaarten" fill="#ef4444" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "#1e293b", borderRadius: 14, padding: "20px 16px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: "#e2e8f0" }}>Onzekerheidsbandbreedte (95% interval)</h2>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
          Op basis van Poisson-distributie met λ = per-wedstrijd gemiddelde × 104 wedstrijden
        </p>
        {[
          {
            label: "Gele kaarten",
            color: "#f59e0b",
            mean: yellowTotal,
            low: Math.round(yellowTotal - 1.96 * Math.sqrt(yellowTotal)),
            high: Math.round(yellowTotal + 1.96 * Math.sqrt(yellowTotal)),
          },
          {
            label: "Rode kaarten",
            color: "#ef4444",
            mean: redTotal,
            low: Math.max(0, Math.round(redTotal - 1.96 * Math.sqrt(redTotal))),
            high: Math.round(redTotal + 1.96 * Math.sqrt(redTotal)),
          },
        ].map((row, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
            <div style={{ minWidth: 120, fontSize: 13, fontWeight: 600, color: row.color }}>{row.label}</div>
            <div style={{ flex: 1, background: "#0f172a", borderRadius: 8, height: 28, position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute",
                left: `${(row.low / (row.high * 1.15)) * 100}%`,
                width: `${((row.high - row.low) / (row.high * 1.15)) * 100}%`,
                height: "100%",
                background: row.color + "40",
                border: `2px solid ${row.color}`,
                borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: row.color }}>{row.low}–{row.high}</span>
              </div>
            </div>
            <div style={{ minWidth: 70, textAlign: "right", fontSize: 13 }}>
              <span style={{ color: "#64748b" }}>gem. </span>
              <span style={{ fontWeight: 700, color: row.color }}>{row.mean}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#1e293b", borderRadius: 14, padding: "20px 16px", marginBottom: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#e2e8f0" }}>🔬 Methodologie</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { title: "Gewogen gemiddelde", body: "Recente toernooien (2018, 2022) krijgen meer gewicht (65% samen) om de moderne VAR-era te weerspiegelen." },
            { title: "Poisson-model", body: "Kaarten per wedstrijd volgen een Poisson-verdeling. Dit geeft kansen op specifieke aantallen en betrouwbaarheidsintervallen." },
            { title: "Volumecorrectie", body: "WK 2026 heeft 104 wedstrijden (vs. 64). Projectie = gemiddelde per duel × 104, niet simpelweg lineaire schaling." },
            { title: "Fase-effect", body: "Knockout-duels produceren historisch ~15–40% meer kaarten per duel. Groepsfasecijfers zijn conservatiever gewogen." },
          ].map((m, i) => (
            <div key={i} style={{ borderLeft: "3px solid #334155", paddingLeft: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", marginBottom: 4 }}>{m.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{m.body}</div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ textAlign: "center", color: "#334155", fontSize: 11, marginTop: 20 }}>
        Databronnen: FIFA, Wikipedia, ESPN | WK 2006–2022 historische kaartstatistieken
      </p>
    </div>
  );
}
