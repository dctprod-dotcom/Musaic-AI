import { useState } from "react";

// ─── Design tokens (matches Musaic AI: Outfit font, dark, #00FFDD) ───────────
const T = {
  bg: "#0A0A0F",
  surface: "rgba(255,255,255,0.04)",
  surfaceHover: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.08)",
  accent: "#00FFDD",
  accentDim: "rgba(0,255,221,0.12)",
  accentGlow: "rgba(0,255,221,0.25)",
  text: "#F0F0F0",
  muted: "#6B7280",
  warning: "#F59E0B",
  success: "#10B981",
  error: "#EF4444",
};

// ─── Timeline task definitions ────────────────────────────────────────────────
const TIMELINE_TASKS = [
  // J-30
  { id: "dist-1",  day: -30, cat: "distribution", label: "Choisir ta date de sortie", icon: "📅", module: null },
  { id: "vis-1",   day: -30, cat: "visuels",       label: "Brief artiste pour la cover", icon: "🎨", module: null },
  // J-21
  { id: "dist-2",  day: -21, cat: "distribution",  label: "Uploader sur DistroKid / TuneCore", icon: "🚀", module: null },
  { id: "promo-1", day: -21, cat: "promo",          label: "Identifier les playlists cibles", icon: "🎵", module: null },
  { id: "vis-2",   day: -21, cat: "visuels",        label: "Finaliser la cover art", icon: "🖼️", module: null },
  // J-14
  { id: "promo-2", day: -14, cat: "promo",          label: "Générer les emails de pitch", icon: "📧", module: "pitch" },
  { id: "vis-3",   day: -14, cat: "visuels",        label: "Créer les visuels réseaux sociaux", icon: "📸", module: null },
  { id: "social-1",day: -14, cat: "social",         label: "Planifier le contenu social", icon: "📱", module: null },
  // J-7
  { id: "promo-3", day: -7,  cat: "promo",          label: "Envoyer les pitchs blogs/médias", icon: "📤", module: "pitch" },
  { id: "social-2",day: -7,  cat: "social",         label: "Générer les captions & hashtags", icon: "✍️", module: "caption" },
  { id: "dist-3",  day: -7,  cat: "distribution",   label: "Vérifier l'état de distribution", icon: "✅", module: null },
  // J-3
  { id: "social-3",day: -3,  cat: "social",         label: "Post teaser (stories / reels)", icon: "🎬", module: "caption" },
  { id: "promo-4", day: -3,  cat: "promo",          label: "Relance playlists Spotify", icon: "🔁", module: "pitch" },
  // JOUR J
  { id: "dist-4",  day: 0,   cat: "distribution",   label: "🎉 SORTIE OFFICIELLE", icon: "🔥", module: null, highlight: true },
  { id: "social-4",day: 0,   cat: "social",         label: "Post d'annonce principal", icon: "📣", module: "caption" },
  // J+3
  { id: "social-5",day: 3,   cat: "social",         label: "Post engagement (réactions fans)", icon: "💬", module: "caption" },
  { id: "promo-5", day: 3,   cat: "promo",          label: "Suivre les stats de streaming", icon: "📊", module: null },
  // J+7
  { id: "promo-6", day: 7,   cat: "promo",          label: "Relancer les blogs non-répondus", icon: "📬", module: "pitch" },
  { id: "social-6",day: 7,   cat: "social",         label: "Contenu behind-the-scenes", icon: "🎥", module: "caption" },
  // J+14
  { id: "dist-5",  day: 14,  cat: "distribution",   label: "Bilan de release", icon: "📈", module: null },
  { id: "social-7",day: 14,  cat: "social",         label: "Post récapitulatif / merci fans", icon: "🙏", module: "caption" },
];

const DAYS = [-30, -21, -14, -7, -3, 0, 3, 7, 14];

const CAT_COLORS = {
  distribution: { color: "#818CF8", bg: "rgba(129,140,248,0.12)" },
  promo:        { color: "#F472B6", bg: "rgba(244,114,182,0.12)" },
  visuels:      { color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
  social:       { color: "#00FFDD", bg: "rgba(0,255,221,0.12)" },
};

const CAT_LABELS = {
  distribution: "Distribution",
  promo: "Promo & Pitching",
  visuels: "Visuels",
  social: "Réseaux sociaux",
};

// ─── AI Modal ────────────────────────────────────────────────────────────────
function AIModal({ type, releaseData, onClose }) {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPitch = type === "pitch";

  const systemPrompt = isPitch
    ? `Tu es un expert en promotion musicale. Génère un email de pitch professionnel, concis et percutant pour pitcher cette sortie musicale à des curators de playlists Spotify ou des blogs musicaux. Ton, direct, personnalisé. Max 150 mots.`
    : `Tu es un expert en marketing digital pour artistes. Génère 3 captions engageants avec hashtags pour cette sortie musicale. Chaque caption doit avoir un ton différent : hype, intime, mystérieux. Inclus 8-12 hashtags pertinents par caption.`;

  const userPrompt = isPitch
    ? `Artiste : ${releaseData.artist || "Artiste"}\nTitre : ${releaseData.title || "Ma sortie"}\nGenre : ${releaseData.genre || "Pop/Urban"}\nDate de sortie : ${releaseData.releaseDate || "prochainement"}\nDescription : ${releaseData.description || ""}`
    : `Artiste : ${releaseData.artist || "Artiste"}\nTitre : ${releaseData.title || "Ma sortie"}\nGenre : ${releaseData.genre || "Pop/Urban"}\nDate de sortie : ${releaseData.releaseDate || "prochainement"}\nVibe / message : ${releaseData.description || ""}`;

  const generate = async () => {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      setResult(text);
    } catch (e) {
      setError("Erreur de génération. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "#12121A", border: `1px solid ${T.border}`,
        borderRadius: "20px", padding: "32px", maxWidth: "560px", width: "100%",
        boxShadow: `0 0 60px ${T.accentGlow}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "11px", color: T.accent, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
              {isPitch ? "📧 Pitch Email Generator" : "✍️ Caption Generator"}
            </div>
            <div style={{ fontSize: "20px", color: T.text, fontWeight: 700, fontFamily: "Outfit, sans-serif" }}>
              {isPitch ? "Générer un email de pitch" : "Générer des captions"}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: T.surface, border: `1px solid ${T.border}`, color: T.muted,
            width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer",
            fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* Release summary */}
        <div style={{
          background: T.accentDim, border: `1px solid rgba(0,255,221,0.2)`,
          borderRadius: "12px", padding: "16px", marginBottom: "24px",
        }}>
          <div style={{ fontSize: "12px", color: T.accent, fontWeight: 600, marginBottom: "8px" }}>Release</div>
          <div style={{ fontSize: "15px", color: T.text, fontWeight: 700 }}>{releaseData.title || "Sans titre"}</div>
          <div style={{ fontSize: "13px", color: T.muted, marginTop: "2px" }}>
            {releaseData.artist || "Artiste"} · {releaseData.genre || "Genre"} · {releaseData.releaseDate || "Date ?"}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: "12px", cursor: loading ? "not-allowed" : "pointer",
            background: loading ? T.surface : T.accent,
            color: loading ? T.muted : "#000",
            border: "none", fontFamily: "Outfit, sans-serif", fontWeight: 700,
            fontSize: "15px", letterSpacing: "0.5px", transition: "all 0.2s",
            marginBottom: "20px",
          }}
        >
          {loading ? "⏳ Génération en cours..." : `✨ Générer ${isPitch ? "le pitch" : "les captions"}`}
        </button>

        {error && (
          <div style={{ color: T.error, fontSize: "13px", padding: "12px", background: "rgba(239,68,68,0.1)", borderRadius: "8px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: "12px", padding: "20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: T.accent, fontWeight: 600 }}>Résultat</div>
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                style={{
                  background: T.accentDim, border: `1px solid rgba(0,255,221,0.2)`,
                  color: T.accent, padding: "4px 12px", borderRadius: "6px",
                  fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "Outfit, sans-serif",
                }}
              >
                📋 Copier
              </button>
            </div>
            <div style={{
              fontSize: "13px", color: T.text, lineHeight: "1.8",
              whiteSpace: "pre-wrap", maxHeight: "260px", overflowY: "auto",
            }}>
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, done, onToggle, onOpenModule }) {
  const cat = CAT_COLORS[task.cat];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "10px 14px", borderRadius: "10px",
      background: done ? "rgba(16,185,129,0.06)" : T.surface,
      border: `1px solid ${done ? "rgba(16,185,129,0.2)" : T.border}`,
      transition: "all 0.2s",
      opacity: done ? 0.7 : 1,
    }}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        style={{
          width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
          border: `2px solid ${done ? T.success : T.muted}`,
          background: done ? T.success : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11px",
        }}
      >
        {done && "✓"}
      </button>

      {/* Icon + label */}
      <span style={{ fontSize: "16px" }}>{task.icon}</span>
      <span style={{
        flex: 1, fontSize: "13px", color: done ? T.muted : T.text,
        textDecoration: done ? "line-through" : "none",
        fontWeight: task.highlight ? 700 : 400,
      }}>
        {task.label}
      </span>

      {/* Category badge */}
      <span style={{
        fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px",
        color: cat.color, background: cat.bg,
        padding: "2px 8px", borderRadius: "20px", flexShrink: 0,
      }}>
        {CAT_LABELS[task.cat].toUpperCase()}
      </span>

      {/* Module button */}
      {task.module && (
        <button
          onClick={() => onOpenModule(task.module)}
          style={{
            background: T.accentDim, border: `1px solid rgba(0,255,221,0.25)`,
            color: T.accent, padding: "4px 10px", borderRadius: "6px",
            fontSize: "11px", fontWeight: 700, cursor: "pointer",
            fontFamily: "Outfit, sans-serif", flexShrink: 0, whiteSpace: "nowrap",
          }}
        >
          ✨ AI
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReleaseHub() {
  const [step, setStep] = useState("form"); // "form" | "hub"
  const [releaseData, setReleaseData] = useState({
    title: "", artist: "", genre: "", releaseDate: "", description: "",
  });
  const [doneTasks, setDoneTasks] = useState(new Set());
  const [activeModal, setActiveModal] = useState(null); // "pitch" | "caption"

  const toggleTask = (id) => {
    setDoneTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const progress = Math.round((doneTasks.size / TIMELINE_TASKS.length) * 100);

  // ── STEP 1: Release Form ──────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div style={{
        minHeight: "100vh", background: T.bg, fontFamily: "Outfit, sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 20px",
      }}>
        <div style={{ maxWidth: "480px", width: "100%" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: T.accentDim, border: `1px solid rgba(0,255,221,0.2)`,
              borderRadius: "30px", padding: "6px 16px", marginBottom: "20px",
            }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: T.accent, display: "inline-block" }}/>
              <span style={{ fontSize: "11px", color: T.accent, fontWeight: 700, letterSpacing: "2px" }}>RELEASE HUB</span>
            </div>
            <h1 style={{ fontSize: "32px", color: T.text, fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
              Ton GPS de sortie musicale
            </h1>
            <p style={{ color: T.muted, fontSize: "15px", margin: 0 }}>
              Renseigne ta release pour générer ta timeline personnalisée J-30 → J+14
            </p>
          </div>

          {/* Form card */}
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: "20px", padding: "32px",
          }}>
            {[
              { key: "title",       label: "Titre de la sortie *", placeholder: "Ex: Nuit Blanche", type: "text" },
              { key: "artist",      label: "Nom d'artiste *",      placeholder: "Ex: Lyna",         type: "text" },
              { key: "genre",       label: "Genre musical",        placeholder: "Ex: R&B / Afro",   type: "text" },
              { key: "releaseDate", label: "Date de sortie",       placeholder: "",                 type: "date" },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", color: T.muted, fontWeight: 600, display: "block", marginBottom: "6px", letterSpacing: "0.5px" }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={releaseData[field.key]}
                  onChange={e => setReleaseData(p => ({ ...p, [field.key]: e.target.value }))}
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
                    color: T.text, fontSize: "14px", fontFamily: "Outfit, sans-serif",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            ))}

            <div style={{ marginBottom: "28px" }}>
              <label style={{ fontSize: "12px", color: T.muted, fontWeight: 600, display: "block", marginBottom: "6px", letterSpacing: "0.5px" }}>
                Description / vibe du track
              </label>
              <textarea
                placeholder="De quoi parle le morceau ? Quelle émotion ? Pour quels curators ?"
                value={releaseData.description}
                onChange={e => setReleaseData(p => ({ ...p, description: e.target.value }))}
                rows={3}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: "10px",
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
                  color: T.text, fontSize: "14px", fontFamily: "Outfit, sans-serif",
                  outline: "none", resize: "vertical", boxSizing: "border-box",
                }}
              />
            </div>

            <button
              onClick={() => releaseData.title && releaseData.artist && setStep("hub")}
              disabled={!releaseData.title || !releaseData.artist}
              style={{
                width: "100%", padding: "16px", borderRadius: "12px",
                background: releaseData.title && releaseData.artist ? T.accent : T.surface,
                color: releaseData.title && releaseData.artist ? "#000" : T.muted,
                border: "none", fontFamily: "Outfit, sans-serif", fontWeight: 800,
                fontSize: "16px", cursor: releaseData.title && releaseData.artist ? "pointer" : "not-allowed",
                transition: "all 0.2s", letterSpacing: "0.5px",
              }}
            >
              Générer ma timeline →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: Timeline Hub ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Outfit, sans-serif" }}>
      {activeModal && (
        <AIModal
          type={activeModal}
          releaseData={releaseData}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Top bar */}
      <div style={{
        borderBottom: `1px solid ${T.border}`, padding: "16px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(10,10,15,0.9)", backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            display: "inline-flex", gap: "8px", alignItems: "center",
            background: T.accentDim, border: `1px solid rgba(0,255,221,0.2)`,
            borderRadius: "30px", padding: "4px 14px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.accent, display: "inline-block" }}/>
            <span style={{ fontSize: "10px", color: T.accent, fontWeight: 700, letterSpacing: "2px" }}>RELEASE HUB</span>
          </div>
          <div>
            <div style={{ fontSize: "16px", color: T.text, fontWeight: 800 }}>{releaseData.title}</div>
            <div style={{ fontSize: "12px", color: T.muted }}>{releaseData.artist} · {releaseData.genre || "Genre"}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Progress */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: T.muted, marginBottom: "4px" }}>Progression</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "120px", height: "6px", borderRadius: "3px",
                background: T.surface, overflow: "hidden",
              }}>
                <div style={{
                  width: `${progress}%`, height: "100%",
                  background: `linear-gradient(90deg, ${T.accent}, #00B8FF)`,
                  borderRadius: "3px", transition: "width 0.3s",
                }}/>
              </div>
              <span style={{ fontSize: "13px", color: T.accent, fontWeight: 700 }}>{progress}%</span>
            </div>
          </div>
          <button
            onClick={() => setStep("form")}
            style={{
              background: T.surface, border: `1px solid ${T.border}`, color: T.muted,
              padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
              fontSize: "12px", fontFamily: "Outfit, sans-serif", fontWeight: 600,
            }}
          >
            ← Modifier
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Category legend */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "36px" }}>
          {Object.entries(CAT_LABELS).map(([key, label]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: CAT_COLORS[key].color }}/>
              <span style={{ fontSize: "12px", color: T.muted, fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Days */}
        {DAYS.map(day => {
          const tasks = TIMELINE_TASKS.filter(t => t.day === day);
          const isToday = day === 0;
          const isPast = day < 0;
          return (
            <div key={day} style={{ display: "flex", gap: "24px", marginBottom: "36px" }}>
              {/* Day marker */}
              <div style={{ width: "72px", flexShrink: 0, paddingTop: "10px" }}>
                <div style={{
                  textAlign: "center", padding: "8px 4px", borderRadius: "10px",
                  background: isToday ? T.accent : isPast ? "rgba(107,114,128,0.1)" : T.surface,
                  border: `1px solid ${isToday ? T.accent : T.border}`,
                }}>
                  <div style={{
                    fontSize: "18px", fontWeight: 800,
                    color: isToday ? "#000" : isPast ? T.muted : T.accent,
                  }}>
                    {day === 0 ? "J" : `J${day > 0 ? "+" : ""}${day}`}
                  </div>
                  {isToday && <div style={{ fontSize: "9px", color: "#000", fontWeight: 700, letterSpacing: "1px" }}>SORTIE</div>}
                </div>
              </div>

              {/* Tasks */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                {tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    done={doneTasks.has(task.id)}
                    onToggle={toggleTask}
                    onOpenModule={setActiveModal}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Bottom CTA */}
        <div style={{
          marginTop: "48px", padding: "28px 32px", borderRadius: "16px",
          background: T.accentDim, border: `1px solid rgba(0,255,221,0.2)`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
        }}>
          <div>
            <div style={{ fontSize: "16px", color: T.text, fontWeight: 700, marginBottom: "4px" }}>
              {doneTasks.size} / {TIMELINE_TASKS.length} tâches complétées
            </div>
            <div style={{ fontSize: "13px", color: T.muted }}>
              Continue sur ta lancée — ta sortie se prépare 🎯
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setActiveModal("pitch")}
              style={{
                padding: "12px 20px", borderRadius: "10px", cursor: "pointer",
                background: "rgba(244,114,182,0.12)", border: "1px solid rgba(244,114,182,0.3)",
                color: "#F472B6", fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "13px",
              }}
            >
              📧 Générer un pitch
            </button>
            <button
              onClick={() => setActiveModal("caption")}
              style={{
                padding: "12px 20px", borderRadius: "10px", cursor: "pointer",
                background: T.accentDim, border: `1px solid rgba(0,255,221,0.3)`,
                color: T.accent, fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "13px",
              }}
            >
              ✍️ Générer des captions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
