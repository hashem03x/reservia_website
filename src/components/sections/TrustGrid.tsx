import type { Dictionary } from '../../i18n/translations/en';

/** Ported from the template's `.tg` trust grid (tk1..tk6). */
export function TrustGrid({ t }: { t: Dictionary }) {
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({ title: t[`tk${n}_t`], body: t[`tk${n}_d`] }));
  return (
    <div className="tg">
      {items.map((item, i) => (
        <div key={i}>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </div>
      ))}
    </div>
  );
}
