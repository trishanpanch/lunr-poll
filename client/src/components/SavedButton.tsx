/**
 * SavedButton — design-system source of truth for the Save/Saved toggle.
 *
 * States:
 *   - isDirty=true, hasEverSaved=false → "Save Draft" (or custom saveLabel)
 *   - isDirty=true, hasEverSaved=true  → "Save Draft" (or custom saveLabel)
 *   - isDirty=false, hasEverSaved=true → "Saved" (outlined, green icon + text)
 *   - isDirty=false, hasEverSaved=false → nothing shown (or disabled)
 *
 * For pages that use a two-state toggle (dirty / saved) without a "first save"
 * concept, pass hasEverSaved=true unconditionally.
 *
 * Canonical design (from design review 2026-03-22):
 *   Saved state  → variant="outline", green CheckCircle2 icon, green text, no fill
 *   Dirty state  → variant="outline", default text/border, save icon, normal text
 */

import { Button } from "@/components/ui/button";
import { CheckCircle2, Save } from "lucide-react";

interface SavedButtonProps {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Whether the user has explicitly saved at least once (controls whether to show "Saved") */
  hasEverSaved?: boolean;
  /** Called when the button is clicked in the dirty state */
  onSave: () => void;
  /** Label to show in the dirty/unsaved state. Defaults to "Save Draft". */
  saveLabel?: string;
  /** Whether a save is currently in progress */
  isSaving?: boolean;
  /** Additional className forwarded to the Button */
  className?: string;
}

export function SavedButton({
  isDirty,
  hasEverSaved = true,
  onSave,
  saveLabel = "Save Draft",
  isSaving = false,
  className = "",
}: SavedButtonProps) {
  const isSaved = !isDirty && hasEverSaved;

  return (
    <Button
      variant="outline"
      onClick={onSave}
      disabled={isSaving || isSaved}
      className={[
        "gap-1.5",
        isSaved ? "text-green-600 border-border cursor-default" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ fontFamily: "'Geist', system-ui, sans-serif", fontSize: 13 }}
    >
      {isSaved ? (
        <>
          <CheckCircle2 size={14} className="text-green-600" />
          Saved
        </>
      ) : (
        <>
          <Save size={14} />
          {isSaving ? "Saving…" : saveLabel}
        </>
      )}
    </Button>
  );
}
