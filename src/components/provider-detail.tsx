"use client";

import { PROVIDERS } from "@/lib/ai/providers";
import type { Provider } from "@/lib/ai/providers";

interface ProviderDetailProps {
  provider: Provider;
}

export function ProviderDetail({ provider }: ProviderDetailProps) {
  const p = PROVIDERS[provider];

  return (
    <dl className="text-[0.9375rem] leading-[1.55]">
      <Row term="Biaya" value={`${p.billing}. ${p.billingNote}`} />
      <Row term="Data" value={`${p.data}. ${p.dataNote}`} />
      {p.limits.length > 0 && <Row term="Batas" value={p.limits.join(". ")} />}
    </dl>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="grid gap-0.5 border-t border-border py-3 first:border-t-0 first:pt-0 sm:grid-cols-[7rem_1fr] sm:gap-4">
      <dt className="text-muted-foreground">{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}
