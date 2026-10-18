/** Ported from the template's `.pillars` grid (used by "What we stand for" and the two HSE/how-we-work sections). */
export function Pillars({ items }: { items: Array<{ title?: string; body: string }> }) {
  return (
    <div className="pillars">
      {items.map((item, i) => (
        <div key={i}>
          {item.title && <h3>{item.title}</h3>}
          <p>{item.body}</p>
        </div>
      ))}
    </div>
  );
}
