import React, { useEffect, useState } from 'react';

interface TrialStatusResponse {
  active: boolean;
  daysRemaining?: number;
  expiresAt?: string;
}

export default function TrialBanner() {
  const [status, setStatus] = useState<TrialStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/billing/trial/status', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load trial status');
        const data = (await res.json()) as TrialStatusResponse;
        setStatus(data);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return null;
  if (!status) return null;

  if (!status.active) return null;

  const days = status.daysRemaining ?? 0;
  return (
    <div className="bg-primary/10 text-primary rounded-xl p-4 mb-4 animate-fade-in">
      <p className="font-medium text-sm">
        🎉 Your free 7‑day trial is active – {days} day{days !== 1 ? 's' : ''} remaining!
      </p>
    </div>
  );
}
