/**
 * ConsultationPrep — Patient-facing tool. Generates questions to ask,
 * symptoms to track, and prep tips for an upcoming holistic consultation.
 */
import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api-client";

const PRACTITIONERS = [
  "TCM",
  "Western Herbalist",
  "Naturopath",
  "Ayurvedic",
  "Integrative",
  "Other",
] as const;

type PractitionerType = (typeof PRACTITIONERS)[number];

interface PrepResult {
  questionsToAsk: Array<{ question: string; why: string }>;
  symptomsToTrack: Array<{ symptom: string; how: string }>;
  topicsToMention: string[];
  whatToBring: string[];
  redFlags: string[];
  preparationTips: string[];
  disclaimer: string;
}

export default function ConsultationPrep() {
  const [practitionerType, setPractitionerType] = useState<PractitionerType>("TCM");
  const [primaryComplaint, setPrimaryComplaint] = useState("");
  const [duration, setDuration] = useState("");
  const [goals, setGoals] = useState("");
  const [triedAlready, setTriedAlready] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [medications, setMedications] = useState("");
  const [conditions, setConditions] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PrepResult | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    setSaveState("idle");
  }, [result]);

  function splitList(s: string): string[] {
    return s.split(/[,\n]+/).map((x) => x.trim()).filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const payload: any = {
        practitionerType,
        primaryComplaint: primaryComplaint.trim(),
      };
      if (duration.trim()) payload.duration = duration.trim();
      const g = splitList(goals);
      const t = splitList(triedAlready);
      if (g.length) payload.goals = g;
      if (t.length) payload.triedAlready = t;
      const ageNum = age ? Number(age) : undefined;
      const ctx: any = {};
      if (ageNum && Number.isFinite(ageNum)) ctx.age = ageNum;
      if (sex) ctx.sex = sex;
      const m = splitList(medications);
      const c = splitList(conditions);
      if (m.length) ctx.medications = m;
      if (c.length) ctx.conditions = c;
      if (Object.keys(ctx).length > 0) payload.context = ctx;

      const res = await apiFetch("/api/grok/consultation-prep", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate prep guide");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function saveReport() {
    if (!result || saveState === "saving") return;
    setSaveState("saving");
    try {
      const res = await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          report_type: "other",
          title: `Prep: ${practitionerType} consultation — ${primaryComplaint.slice(0, 60)}`,
          summary: `${result.questionsToAsk.length} questions, ${result.symptomsToTrack.length} symptoms to track`,
          data: { kind: "consultation_prep", input: { practitionerType, primaryComplaint }, result },
        }),
      });
      if (!res.ok) {
        setSaveState("error");
        return;
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  function copyChecklist() {
    if (!result) return;
    const lines: string[] = [`Consultation Prep — ${practitionerType}`, "=".repeat(40), ""];
    lines.push(`Primary complaint: ${primaryComplaint}`, "");

    if (result.questionsToAsk.length) {
      lines.push("Questions to ask:");
      for (const q of result.questionsToAsk) lines.push(`  • ${q.question}`, `    Why: ${q.why}`);
      lines.push("");
    }
    if (result.symptomsToTrack.length) {
      lines.push("Symptoms to track:");
      for (const s of result.symptomsToTrack) lines.push(`  • ${s.symptom}`, `    How: ${s.how}`);
      lines.push("");
    }
    if (result.topicsToMention.length) {
      lines.push("Topics to mention:");
      for (const t of result.topicsToMention) lines.push(`  • ${t}`);
      lines.push("");
    }
    if (result.whatToBring.length) {
      lines.push("What to bring:");
      for (const w of result.whatToBring) lines.push(`  • ${w}`);
      lines.push("");
    }
    if (result.redFlags.length) {
      lines.push("Red flags (urgent care, not consultation):");
      for (const r of result.redFlags) lines.push(`  • ${r}`);
      lines.push("");
    }
    if (result.preparationTips.length) {
      lines.push("Preparation tips:");
      for (const p of result.preparationTips) lines.push(`  • ${p}`);
      lines.push("");
    }
    lines.push(result.disclaimer);

    navigator.clipboard?.writeText(lines.join("\n")).catch(() => {});
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-1">
              Practitioner type
            </label>
            <select
              value={practitionerType}
              onChange={(e) => setPractitionerType(e.target.value as PractitionerType)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100"
            >
              {PRACTITIONERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-1">
              How long has this been going on?
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 3 months, since last spring"
              className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-1">
            Primary complaint <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={primaryComplaint}
            onChange={(e) => setPrimaryComplaint(e.target.value)}
            placeholder="Describe the main thing you want to address — symptoms, when they happen, what makes them better/worse."
            className="w-full px-4 py-3 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-500"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-1">
              What do you hope to get out of this visit?
            </label>
            <textarea
              rows={2}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="One per line. e.g., understand what's going on; reduce daily fatigue; not rely on caffeine"
              className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-earth-300 mb-1">
              What have you already tried?
            </label>
            <textarea
              rows={2}
              value={triedAlready}
              onChange={(e) => setTriedAlready(e.target.value)}
              placeholder="One per line. e.g., 3 months gluten-free; magnesium; meditation app"
              className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 text-sm"
            />
          </div>
        </div>

        <details className="group">
          <summary className="cursor-pointer font-semibold text-sm text-gray-700 dark:text-earth-300 select-none flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform">▸</span> Optional: a bit about you
          </summary>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Age</label>
              <input
                type="number"
                min="0"
                max="130"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Sex</label>
              <input
                type="text"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Medications</label>
              <textarea
                rows={2}
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="One per line"
                className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-earth-300 mb-1">Existing conditions</label>
              <textarea
                rows={2}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="One per line"
                className="w-full px-3 py-2 border border-gray-200 dark:border-earth-600 rounded-lg bg-white dark:bg-earth-800 text-gray-900 dark:text-earth-100 text-sm"
              />
            </div>
          </div>
        </details>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || primaryComplaint.trim().length < 5}
          className="w-full bg-gradient-to-r from-sage-600 to-earth-600 hover:from-sage-700 hover:to-earth-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Building your prep guide…
            </>
          ) : (
            "Generate Prep Guide"
          )}
        </button>
      </form>

      {result && (
        <div className="space-y-5">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={copyChecklist}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-earth-600 text-gray-700 dark:text-earth-200 hover:bg-gray-50 dark:hover:bg-earth-800 transition"
            >
              Copy checklist
            </button>
            <button
              type="button"
              onClick={saveReport}
              disabled={saveState === "saving" || saveState === "saved"}
              className={`text-sm px-3 py-1.5 rounded-lg transition ${
                saveState === "saved"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-sage-600 hover:bg-sage-700 text-white disabled:opacity-60"
              }`}
            >
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved" : "Save to dashboard"}
            </button>
          </div>

          {result.questionsToAsk.length > 0 && (
            <section className="bg-white dark:bg-earth-900 border border-gray-100 dark:border-earth-700 rounded-xl p-5">
              <h2 className="font-serif text-lg font-bold text-gray-900 dark:text-earth-100 mb-3">Questions to ask</h2>
              <ol className="space-y-3 list-decimal list-inside">
                {result.questionsToAsk.map((q, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-earth-200">
                    <span className="font-medium">{q.question}</span>
                    <p className="text-xs text-gray-500 dark:text-earth-400 mt-0.5 ml-5 italic">{q.why}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {result.symptomsToTrack.length > 0 && (
            <section className="bg-white dark:bg-earth-900 border border-gray-100 dark:border-earth-700 rounded-xl p-5">
              <h2 className="font-serif text-lg font-bold text-gray-900 dark:text-earth-100 mb-3">Symptoms to track before your visit</h2>
              <ul className="space-y-3">
                {result.symptomsToTrack.map((s, idx) => (
                  <li key={idx} className="text-sm">
                    <strong className="text-gray-900 dark:text-earth-100">{s.symptom}</strong>
                    <p className="text-xs text-gray-500 dark:text-earth-400 mt-0.5">{s.how}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {result.topicsToMention.length > 0 && (
              <section className="bg-white dark:bg-earth-900 border border-gray-100 dark:border-earth-700 rounded-xl p-5">
                <h2 className="font-serif text-base font-bold text-gray-900 dark:text-earth-100 mb-2">Topics to bring up</h2>
                <ul className="text-sm text-gray-700 dark:text-earth-200 list-disc list-inside space-y-1">
                  {result.topicsToMention.map((t, idx) => <li key={idx}>{t}</li>)}
                </ul>
              </section>
            )}
            {result.whatToBring.length > 0 && (
              <section className="bg-white dark:bg-earth-900 border border-gray-100 dark:border-earth-700 rounded-xl p-5">
                <h2 className="font-serif text-base font-bold text-gray-900 dark:text-earth-100 mb-2">What to bring</h2>
                <ul className="text-sm text-gray-700 dark:text-earth-200 list-disc list-inside space-y-1">
                  {result.whatToBring.map((t, idx) => <li key={idx}>{t}</li>)}
                </ul>
              </section>
            )}
          </div>

          {result.redFlags.length > 0 && (
            <section className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
              <h2 className="font-serif text-base font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">⛔ Red flags</h2>
              <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                If any of these are present, seek urgent medical care — not a holistic consultation.
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                {result.redFlags.map((r, idx) => <li key={idx}>{r}</li>)}
              </ul>
            </section>
          )}

          {result.preparationTips.length > 0 && (
            <section className="bg-sage-50 dark:bg-earth-900 border border-sage-200 dark:border-earth-700 rounded-xl p-5">
              <h2 className="font-serif text-base font-bold text-sage-800 dark:text-sage-300 mb-2">Tips for the day of</h2>
              <ul className="text-sm text-gray-700 dark:text-earth-200 list-disc list-inside space-y-1">
                {result.preparationTips.map((t, idx) => <li key={idx}>{t}</li>)}
              </ul>
            </section>
          )}

          <p className="text-xs text-gray-500 dark:text-earth-400 italic">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
