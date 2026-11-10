"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROVIDERS, providerIdsFor } from "@/lib/ai/providers";
import type { Provider, ProviderRole } from "@/lib/ai/providers";

interface ProviderPickerProps {
  role: ProviderRole;
  value: Provider;
  onChange: (provider: Provider) => void;
}

export function ProviderPicker({ role, value, onChange }: ProviderPickerProps) {
  const options = providerIdsFor(role);
  const name = `provider-${role}`;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((id) => {
        const p = PROVIDERS[id];
        const selected = id === value;
        return (
          <label
            key={id}
            className={cn(
              "flex cursor-pointer flex-col gap-1 rounded-[16px] border p-4 transition-colors",
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-ring",
              selected
                ? "border-foreground bg-card"
                : "border-foreground/20 hover:bg-secondary",
            )}
          >
            <input
              type="radio"
              name={name}
              value={id}
              checked={selected}
              onChange={() => onChange(id)}
              aria-label={p.label}
              className="sr-only"
            />
            <span className="flex items-center justify-between gap-2">
              <span className="text-[0.9375rem] font-medium">{p.label}</span>
              {selected && (
                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
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
  );
}
