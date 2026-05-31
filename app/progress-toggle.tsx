"use client";

import { useTransition } from "react";
import { CheckCircle2, Circle, RotateCcw, Timer } from "lucide-react";
import { updateProblemProgress } from "@/app/actions";
import type { ProgressStatus } from "@/lib/problems";

const statuses: {
  value: ProgressStatus;
  label: string;
  icon: typeof Circle;
}[] = [
  { value: "NOT_STARTED", label: "Not started", icon: Circle },
  { value: "IN_PROGRESS", label: "In progress", icon: Timer },
  { value: "SOLVED", label: "Solved", icon: CheckCircle2 },
  { value: "REVISITING", label: "Revisiting", icon: RotateCcw }
];

export function ProgressToggle({
  problemId,
  slug,
  status,
  signedIn
}: {
  problemId: string;
  slug: string;
  status: ProgressStatus | null;
  signedIn: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="progress-control">
      {statuses.map((item) => {
        const Icon = item.icon;
        const active = (status ?? "NOT_STARTED") === item.value;

        return (
          <button
            aria-pressed={active}
            className={active ? "active" : ""}
            disabled={pending || !signedIn}
            key={item.value}
            onClick={() => startTransition(() => updateProblemProgress(problemId, slug, item.value))}
            title={signedIn ? item.label : "Sign in with Google to track progress."}
            type="button"
          >
            <Icon aria-hidden="true" size={16} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
