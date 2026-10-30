/**
 * Honeypot anti-spam field (Developer Brief: "a hidden honeypot input"), shared by LeadForm.tsx
 * and Contact.tsx. Named `website` (set server-side as the wire field in
 * src/services/leadService.ts) -- a name that reads as plausible to an automated form-filler,
 * which is the point. Real visitors never see or interact with it:
 *  - `aria-hidden="true"` and `tabIndex={-1}` remove it from the accessibility tree and tab order
 *    entirely (never announced by a screen reader, never reachable by keyboard navigation);
 *  - visually hidden via the standard "clip to 1x1px" technique (not `display:none`/
 *    `visibility:hidden`, which some bots skip specifically because those are the well-known
 *    detection patterns -- a clipped-but-present element still has a real, fillable DOM node).
 *    Deliberately NOT the older `left: -9999px` off-canvas technique: an absolutely-positioned
 *    element placed far outside the viewport still contributes to the document's scrollable
 *    width unless an ancestor clips it, which silently created a horizontal scrollbar/overflow on
 *    every page that renders a lead form (caught by this project's own axe/overflow browser
 *    tests). `position: absolute` here keeps the field at its natural in-flow position, clipped
 *    to 1x1px with `overflow: hidden`, so it can never affect page layout or scrollWidth.
 *  - `autoComplete="off"` and `tabIndex={-1}` additionally stop a browser's own autofill from
 *    ever populating it for a real user.
 * A non-empty value on submit is therefore a reliable bot signal, handled server-side
 * (publicLeadIntakeService.js) by silently accepting the request without creating a lead.
 */
export function HoneypotField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div style={{ position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', whiteSpace: 'nowrap', border: 0, clip: 'rect(0 0 0 0)' }} aria-hidden="true">
      <label htmlFor="website">Leave this field empty</label>
      <input
        id="website"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
