import { useLanguage } from '../../i18n/LanguageContext';
import type { Dictionary } from '../../i18n/translations/en';
import { toNumber } from './numbers';


/** Accessible radio group in the calculator's pill style (the same control everywhere). */
export function ChoiceGroup<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
}: {
  name: string;
  legend: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="field choices">
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className="choice">
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  step,
  min = 0,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  min?: number;
  hint?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="number" min={min} step={step} inputMode="decimal" value={value} onChange={(e) => onChange(toNumber(e.target.value))} aria-describedby={hint ? `${id}_h` : undefined} />
      {hint && (
        <span className="hint" id={`${id}_h`}>
          {hint}
        </span>
      )}
    </div>
  );
}

/**
 * Energy inputs for a site that is either grid-connected or runs on diesel
 * generators -- shared by Industrial Facilities and Services Sector so both
 * behave identically. Each figure keeps its own state, so switching between
 * bill / kWh / litres / EGP never erases or reinterprets another value, and
 * only the inputs for the selected connection and unit are shown (no
 * contradictory combinations can be entered).
 */
export interface SiteEnergy {
  config: 'on-grid' | 'off-grid';
  gridInput: 'bill' | 'kwh';
  bill: number;
  kwh: number;
  dieselInput: 'litres' | 'egp';
  litres: number;
  dieselEgp: number;
  dieselPrice: number;
  share: number;
}

export function SiteEnergyInputs({ prefix, value, onChange, tariff }: { prefix: string; value: SiteEnergy; onChange: (patch: Partial<SiteEnergy>) => void; tariff: number }) {
  const { t } = useLanguage();
  const v = value;
  return (
    <>
      <ChoiceGroup
        name={`${prefix}_config`}
        legend={t.f_imode}
        value={v.config}
        options={[
          { value: 'on-grid', label: t.opt_grid },
          { value: 'off-grid', label: t.opt_diesel },
        ]}
        onChange={(config) => onChange({ config })}
      />
      {v.config === 'on-grid' ? (
        <>
          <ChoiceGroup
            name={`${prefix}_gunit`}
            legend={t.f_gunit}
            value={v.gridInput}
            options={[
              { value: 'bill', label: t.opt_gbill },
              { value: 'kwh', label: t.opt_gkwh },
            ]}
            onChange={(gridInput) => onChange({ gridInput })}
          />
          {v.gridInput === 'bill' ? (
            <NumberField id={`${prefix}_bill`} label={t.f_icost} value={v.bill} step={5000} onChange={(bill) => onChange({ bill })} hint={t.h_icost_grid} />
          ) : (
            <NumberField id={`${prefix}_kwh`} label={t.f_gkwh} value={v.kwh} step={1000} onChange={(kwh) => onChange({ kwh })} hint={t.h_gkwh.replace('{tar}', tariff.toFixed(2))} />
          )}
        </>
      ) : (
        <DieselInputs prefix={prefix} t={t} input={v.dieselInput} litres={v.litres} egp={v.dieselEgp} price={v.dieselPrice} onChange={(p) => onChange(p)} />
      )}
      <div className="field">
        <label htmlFor={`${prefix}_share`}>
          <span>{t.f_ishare}</span> <span className="rv">{v.share}%</span>
        </label>
        <input id={`${prefix}_share`} type="range" min={10} max={80} step={5} value={v.share} aria-valuetext={`${v.share}%`} onChange={(e) => onChange({ share: Number(e.target.value) })} />
      </div>
    </>
  );
}

/** Diesel use as litres or EGP a month (one at a time), plus the diesel price used to convert EGP to litres. */
export function DieselInputs({
  prefix,
  t,
  input,
  litres,
  egp,
  price,
  onChange,
  litresHint,
}: {
  prefix: string;
  t: Dictionary;
  input: 'litres' | 'egp';
  litres: number;
  egp: number;
  price: number;
  onChange: (patch: { dieselInput?: 'litres' | 'egp'; litres?: number; dieselEgp?: number; dieselPrice?: number }) => void;
  litresHint?: string;
}) {
  return (
    <>
      <ChoiceGroup
        name={`${prefix}_dunit`}
        legend={t.f_dunit}
        value={input}
        options={[
          { value: 'litres', label: t.opt_dlitres },
          { value: 'egp', label: t.opt_degp },
        ]}
        onChange={(dieselInput) => onChange({ dieselInput })}
      />
      {input === 'litres' ? (
        <NumberField id={`${prefix}_litres`} label={t.f_dlitres} value={litres} step={100} onChange={(n) => onChange({ litres: n })} hint={litresHint} />
      ) : (
        <NumberField id={`${prefix}_degp`} label={t.f_degp} value={egp} step={1000} onChange={(n) => onChange({ dieselEgp: n })} hint={t.h_degp} />
      )}
      <NumberField id={`${prefix}_dp`} label={t.f_dp} value={price} step={0.25} min={1} onChange={(n) => onChange({ dieselPrice: n })} />
    </>
  );
}
