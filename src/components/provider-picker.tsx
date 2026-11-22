"use client";

import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROVIDERS, providerIdsFor } from "@/lib/ai/providers";
import type { Provider, ProviderRole } from "@/lib/ai/providers";
import { ProviderDetail } from "@/components/provider-detail";

interface ProviderPickerProps {
  role: ProviderRole;
  value: Provider;
  onChange: (provider: Provider) => void;
}

export function ProviderPicker({ role, value, onChange }: ProviderPickerProps) {
  const options = providerIdsFor(role);
  const name = `provider-${role}`;
  const selected = PROVIDERS[value];

  return (
    <details className="group rounded-[16px] border border-border bg-card">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="text-[0.9375rem] font-medium">{selected.label}</span>
          <span className="ml-2 text-[0.8125rem] text-muted-foreground">
            {selected.billing} · {selected.keyless ? "tanpa key" : "butuh key"}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
          Ganti
          <ChevronDown
            className="h-4 w-4 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
      </summary>

      <div className="border-t border-border p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((id) => {
            const p = PROVIDERS[id];
            const isSelected = id === value;
            return (
              <label
                key={id}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-[16px] border p-4 transition-colors",
                  "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-ring",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-foreground/20 bg-card hover:bg-secondary/60",
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={id}
                  checked={isSelected}
                  onChange={() => onChange(id)}
                  aria-label={p.label}
                  className="sr-only"
                />
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[0.9375rem] font-medium">
                    {p.label}
                  </span>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[0.75rem] font-medium text-foreground">
                      <Check
                        className="h-3 w-3 shrink-0 text-foreground"
                        aria-hidden="true"
                      />
                      Dipilih
                    </span>
                  ) : null}
                </span>
                <span className="line-clamp-2 text-[0.875rem] leading-snug text-muted-foreground">
                  {p.description}
                </span>
                <span className="text-[0.8125rem] text-muted-foreground">
                  {p.billing} · {p.keyless ? "tanpa key" : "butuh key"}
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-3 border-t border-border pt-1">
          <ProviderDetail provider={value} />
        </div>
      </div>
    </details>
  );
}
