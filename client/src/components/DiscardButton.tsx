/**
 * DiscardButton — design-system companion to SavedButton.
 *
 * Canonical design (from design review 2026-03-22):
 *   variant="outline", muted foreground text, RotateCcw icon, no fill.
 *
 * Typically rendered only when isDirty=true (the parent controls visibility).
 */

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface DiscardButtonProps {
  /** Called when the user confirms the discard action */
  onDiscard: () => void;
  /** Label text. Defaults to "Discard". */
  label?: string;
  /** Additional className forwarded to the Button */
  className?: string;
}

export function DiscardButton({
  onDiscard,
  label = "Discard",
  className = "",
}: DiscardButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onDiscard}
      className={["gap-1.5 text-muted-foreground", className]
        .filter(Boolean)
        .join(" ")}
      style={{ fontFamily: "'Geist', system-ui, sans-serif", fontSize: 13 }}
    >
      <RotateCcw size={14} />
      {label}
    </Button>
  );
}
