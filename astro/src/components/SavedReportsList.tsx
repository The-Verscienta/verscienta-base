/**
 * Saved Reports list — fetches the current user's reports and renders them
 * grouped by type with detail-on-click and delete support.
 */
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";

interface ReportSummary {
  id: number | string;
  report_type: string;
  title: string;
  summary?: string;
  date_created?: string;
}

interface ReportDetail extends ReportSummary {
  data?: any;
}

const TYPE_FILTERS: Array<{ value: string; label: string; api: string }> = [
  { value: "all", label: "All", api: "" },
  { value: "interaction_check", label: "Interactions", api: "Interaction Check" },
  { value: "formula_explanation", label: "Formulas", api: "Formula Explanation" },
  { value: "symptom_analysis", label: "Symptoms", api: "Symptom Analysis" },
];

const TYPE_BADGE: Record<string, string> = {
  "Interaction Check": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Formula Explanation": "bg-sage-100 text-sage-700 dark:bg-sage-900/30 dark:text-sage-300",
  "Symptom Analysis": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Other: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

function formatDate(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function SavedReportsList() {
  const [filter, setFilter] = useState("all");
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | number | null>(null);
  const [openDetail, setOpenDetail] = useState<ReportDetail | null>(null);
  const [openLoading, setOpenLoading] = useState(false);

  async function loadReports() {
    setLoading(true);
    setError("");
    try {
      const apiType = TYPE_FILTERS.find((t) => t.value === filter)?.api;
      const url = apiType ? `/api/reports?type=${encodeURIComponent(apiType)}` : "/api/reports";
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function openReport(id: string | number) {
    setOpenId(id);
    setOpenLoading(true);
    setOpenDetail(null);
    try {
      const res = await fetch(`/api/reports/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setOpenDetail(data.report);
    } catch (err) {
      setOpenDetail({ id, report_type: "Other", title: "Error", summary: err instanceof Error ? err.message : "Error" });
    } finally {
      setOpenLoading(false);
    }
  }

  async function deleteReport(id: string | number) {
    if (!confirm("Delete this report? This can't be undone.")) return;
    try {
      const res = await apiFetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setReports(reports.filter((r) => r.id !== id));
      if (openId === id) {
        setOpenId(null);
        setOpenDetail(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setFilter(t.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              filter === t.value
                ? "bg-sage-600 text-white"
                : "bg-white dark:bg-earth-900 text-gray-700 dark:text-earth-300 border border-gray-200 dark:border-earth-700 hover:bg-gray-50 dark:hover:bg-earth-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500 dark:text-earth-400">Loading…</p>}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {!loading && !error && reports.length === 0 && (
        <div className="bg-white dark:bg-earth-900 border border-gray-100 dark:border-earth-700 rounded-xl p-8 text-center">
          <p className="text-gray-600 dark:text-earth-300">No saved reports yet.</p>
          <p className="text-sm text-gray-500 dark:text-earth-400 mt-1">
            Use the{" "}
            <a href="/tools/herb-drug-interactions" className="text-sage-600 hover:underline">drug interaction checker</a>,{" "}
            <a href="/symptom-checker" className="text-sage-600 hover:underline">symptom checker</a>, or open a formula and click{" "}
            <em>Explain this formula</em> — then hit <em>Save to dashboard</em>.
          </p>
        </div>
      )}
      {!loading && reports.length > 0 && (
        <ul className="space-y-2">
          {reports.map((r) => {
            const isOpen = openId === r.id;
            const badge = TYPE_BADGE[r.report_type] || TYPE_BADGE.Other;
            return (
              <li
                key={r.id}
                className="bg-white dark:bg-earth-900 rounded-xl border border-gray-100 dark:border-earth-700 hover:border-sage-300 dark:hover:border-sage-700 transition"
              >
                <div className="flex items-start gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${badge}`}>{r.report_type}</span>
                      <span className="text-xs text-gray-400 dark:text-earth-500">{formatDate(r.date_created)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => (isOpen ? setOpenId(null) : openReport(r.id))}
                      className="font-medium text-gray-900 dark:text-earth-100 hover:text-sage-600 text-left block w-full"
                    >
                      {r.title}
                    </button>
                    {r.summary && <p className="text-sm text-gray-600 dark:text-earth-400 mt-1 line-clamp-2">{r.summary}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteReport(r.id)}
                    aria-label="Delete"
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-sm shrink-0"
                  >
                    Delete
                  </button>
                </div>
                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-earth-700 p-4 bg-gray-50/50 dark:bg-earth-950/30">
                    {openLoading && <p className="text-sm text-gray-500 dark:text-earth-400">Loading…</p>}
                    {!openLoading && openDetail && (
                      <ReportDetailView report={openDetail} />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ReportDetailView({ report }: { report: ReportDetail }) {
  const data = report.data;
  if (report.report_type === "Interaction Check" && data?.result) {
    const interactions: any[] = data.result.interactions || [];
    return (
      <div className="space-y-3">
        <div className="text-xs text-gray-500 dark:text-earth-400">
          {data.medications?.length > 0 && <div><strong>Medications:</strong> {data.medications.join(", ")}</div>}
          {data.herbs?.length > 0 && <div><strong>Herbs:</strong> {data.herbs.join(", ")}</div>}
        </div>
        {interactions.length === 0 ? (
          <p className="text-sm text-green-700 dark:text-green-400">No interactions identified.</p>
        ) : (
          interactions.map((i: any, idx: number) => (
            <div key={idx} className="bg-white dark:bg-earth-900 border border-gray-200 dark:border-earth-700 rounded-lg p-3 text-sm">
              <div className="font-medium text-gray-900 dark:text-earth-100">{i.herb} × {i.medication}</div>
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-earth-400 mt-0.5">{i.severity}</div>
              <p className="text-sm text-gray-700 dark:text-earth-200 mt-2">{i.description}</p>
              {i.recommendation && <p className="text-sm mt-1"><strong>Recommendation:</strong> {i.recommendation}</p>}
            </div>
          ))
        )}
      </div>
    );
  }
  if (report.report_type === "Formula Explanation" && data?.explanation) {
    return (
      <div className="prose prose-earth dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-gray-700 dark:text-earth-200 leading-relaxed">
        {data.explanation}
      </div>
    );
  }
  // Fallback: pretty-print JSON
  return (
    <pre className="text-xs text-gray-600 dark:text-earth-400 whitespace-pre-wrap">
      {JSON.stringify(report.data, null, 2)}
    </pre>
  );
}
