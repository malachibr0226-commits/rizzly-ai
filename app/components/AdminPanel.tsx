"use client";

import { useEffect, useMemo, useState } from "react";

type AdminSnapshot = {
  allowed: boolean;
  currentUserEmail: string | null;
  admins: string[];
  proEmails: string[];
  metrics: Record<string, number>;
  updatedAt?: number;
  error?: string;
};

const EMPTY_SNAPSHOT: AdminSnapshot = {
  allowed: false,
  currentUserEmail: null,
  admins: [],
  proEmails: [],
  metrics: {},
};

export function AdminPanel({ isSignedIn }: { isSignedIn: boolean }) {
  const [snapshot, setSnapshot] = useState<AdminSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshot = async () => {
    if (!isSignedIn) {
      setSnapshot(EMPTY_SNAPSHOT);
      setResolved(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/access", { method: "GET" });
      const data = (await response.json()) as AdminSnapshot;

      if (response.status === 401) {
        setSnapshot(EMPTY_SNAPSHOT);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Unable to load admin controls.");
      }

      setSnapshot({
        allowed: Boolean(data.allowed),
        currentUserEmail: data.currentUserEmail ?? null,
        admins: Array.isArray(data.admins) ? data.admins : [],
        proEmails: Array.isArray(data.proEmails) ? data.proEmails : [],
        metrics: data.metrics ?? {},
        updatedAt: data.updatedAt,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load admin controls.",
      );
    } finally {
      setLoading(false);
      setResolved(true);
    }
  };

  useEffect(() => {
    void fetchSnapshot();
  }, [isSignedIn]);

  const metricCards = useMemo(
    () => [
      {
        label: "Reply runs",
        value: snapshot.metrics.reply_generated ?? 0,
      },
      {
        label: "Copies",
        value: snapshot.metrics.reply_copied ?? 0,
      },
      {
        label: "Sends",
        value: snapshot.metrics.reply_sent ?? 0,
      },
      {
        label: "Outcomes",
        value: snapshot.metrics.outcome_recorded ?? 0,
      },
    ],
    [snapshot.metrics],
  );

  const handleGrant = async (options: {
    grantAdmin: boolean;
    grantPro: boolean;
  }) => {
    if (!email.trim()) {
      setError("Enter an email first.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          ...options,
        }),
      });

      const data = (await response.json()) as AdminSnapshot;
      if (!response.ok) {
        throw new Error(data.error || "Unable to update access.");
      }

      setSnapshot({
        allowed: true,
        currentUserEmail: data.currentUserEmail ?? null,
        admins: Array.isArray(data.admins) ? data.admins : [],
        proEmails: Array.isArray(data.proEmails) ? data.proEmails : [],
        metrics: data.metrics ?? {},
        updatedAt: data.updatedAt,
      });
      setEmail("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to update access.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (targetEmail: string, remove: "admin" | "pro" | "all") => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/access", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: targetEmail,
          remove,
        }),
      });

      const data = (await response.json()) as AdminSnapshot;
      if (!response.ok) {
        throw new Error(data.error || "Unable to remove access.");
      }

      setSnapshot({
        allowed: true,
        currentUserEmail: data.currentUserEmail ?? null,
        admins: Array.isArray(data.admins) ? data.admins : [],
        proEmails: Array.isArray(data.proEmails) ? data.proEmails : [],
        metrics: data.metrics ?? {},
        updatedAt: data.updatedAt,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to remove access.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isSignedIn || !resolved || (!loading && !snapshot.allowed && !error)) {
    return null;
  }

  return (
    <section className="rounded-xl border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.10),rgba(255,255,255,0.03))] p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
            Owner console
          </div>
          <h2 className="mt-2 text-lg font-bold text-white">Admin controls and live conversion counts</h2>
          <p className="mt-1 text-xs text-white/55">
            Manage Pro access, keep owner access tight, and watch key product actions.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
          <div className="font-semibold text-white/90">Signed in as</div>
          <div className="mt-1 break-all">{snapshot.currentUserEmail ?? "owner"}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-center"
          >
            <div className="text-lg font-bold text-white">{item.value}</div>
            <div className="mt-1 text-[11px] text-white/60">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="text-sm font-semibold text-white">Grant access</div>
        <p className="mt-1 text-xs text-white/55">
          Add an email once to unlock Pro, or grant full admin controls for team support.
        </p>

        <div className="mt-3 flex flex-col gap-2 lg:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="min-h-[46px] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-400/35"
          />
          <div className="grid gap-2 sm:grid-cols-2 lg:flex">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleGrant({ grantAdmin: false, grantPro: true })}
              className="rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-2 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Grant Pro
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleGrant({ grantAdmin: true, grantPro: true })}
              className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Grant Admin
            </button>
          </div>
        </div>

        {error && <p className="mt-2 text-xs text-rose-200">{error}</p>}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="mb-2 text-sm font-semibold text-white">Admin emails</div>
          <div className="space-y-2">
            {snapshot.admins.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/75"
              >
                <span className="break-all">{item}</span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleRemove(item, "admin")}
                  className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/70 transition hover:bg-white/10 disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="mb-2 text-sm font-semibold text-white">Pro allowlist</div>
          <div className="space-y-2">
            {snapshot.proEmails.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/75"
              >
                <span className="break-all">{item}</span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleRemove(item, "pro")}
                  className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-white/70 transition hover:bg-white/10 disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-white/45">
        {loading
          ? "Refreshing owner metrics..."
          : `Last updated ${snapshot.updatedAt ? new Date(snapshot.updatedAt).toLocaleString() : "just now"}.`}
      </div>
    </section>
  );
}
