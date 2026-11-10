"use client";

import { PROVIDERS } from "@/lib/ai/providers";
import type { Provider } from "@/lib/ai/providers";

interface ProviderDetailProps {
  provider: Provider;
}

export function ProviderDetail({ provider }: ProviderDetailProps) {
  const p = PROVIDERS[provider];

  return (
    <div className="space-y-2 rounded-2xl bg-secondary p-4 text-[0.9375rem] leading-[1.55]">
      <p>
        <span className="font-medium">Biaya:</span> {p.billing}. {p.billingNote}
      </p>
      <p>
        <span className="font-medium">Data:</span> {p.data}. {p.dataNote}
      </p>
      <p>
        <span className="font-medium">Kunci:</span>{" "}
        {p.keyless
          ? `Tanpa key. ${p.dataNote}`
          : `Butuh key. ${p.signup} ${p.note}`}
      </p>
      <p>
        <span className="font-medium">Transkripsi:</span>{" "}
        {p.stt
          ? `Tersedia lewat model ${p.stt}.`
          : "Belum tersedia di Mindo. Hanya ringkasan, mindmap, flashcard, dan tutor yang bisa dipakai."}
      </p>
      {p.limits.length > 0 && (
        <p>
          <span className="font-medium">Batas:</span> {p.limits.join(". ")}
        </p>
      )}
    </div>
  );
}
