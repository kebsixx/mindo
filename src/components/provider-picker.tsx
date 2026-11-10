"use client";

import { cn } from "@/lib/utils";
import { PROVIDERS, providerIdsFor, ROLE_LABELS } from "@/lib/ai/providers";
import type { Provider, ProviderRole } from "@/lib/ai/providers";

interface ProviderPickerProps {
  role: ProviderRole;
  value: Provider;
  onChange: (provider: Provider) => void;
}

export function ProviderPicker({ role, value, onChange }: ProviderPickerProps) {
  const options = providerIdsFor(role);

  return (
    <div
      role="radiogroup"
      aria-label={ROLE_LABELS[role].title}
      className="space-y-2"
    >
      {options.map((id) => {
        const p = PROVIDERS[id];
        const selected = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(id)}
            className={cn(
              "w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors",
              selected
                ? "border-primary bg-primary/12"
                : "border-border hover:bg-secondary",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{p.label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {p.description}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {p.keyless
                    ? "tanpa key"
                    : `biaya: ${p.billing} · data: ${p.data} · butuh key`}
                </p>
              </div>
              {selected && (
                <span className="shrink-0 text-sm font-medium text-foreground">
                  Dipilih
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
