import type { ReactNode } from 'react';

export const Card = ({
  children,
  className = '',
  plus = 'both',
  style,
}: {
  children: ReactNode;
  className?: string;
  plus?: 'both' | 'tl' | 'br' | 'none';
  style?: React.CSSProperties;
}) => {
  const plusCls =
    plus === 'both' ? 'plus-both' :
    plus === 'tl' ? 'plus-tl' :
    plus === 'br' ? 'plus-br' : '';
  return (
    <div className={`card ${plusCls} ${className}`} style={style}>
      {children}
    </div>
  );
};

export const Bar = ({
  value,
  height = 16,
  color = '#5980a6',
  marks,
}: {
  value: number; // 0..1
  height?: number;
  color?: string;
  marks?: Array<{ at: number; color?: string; big?: boolean }>;
}) => {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div style={{ position: 'relative', height, background: '#e7e7ea' }}>
      <div style={{ height, background: color, width: `${pct}%` }} />
      {marks?.map((m, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: m.big ? -12 : -10,
            bottom: m.big ? -12 : -10,
            width: 2,
            background: m.color ?? '#a4402f',
            left: `${Math.max(0, Math.min(1, m.at)) * 100}%`,
          }}
        />
      ))}
    </div>
  );
};

export const Fact = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <div className="fact">
    <div className="fact__label">{label}</div>
    <div className="fact__value">{value}</div>
    {note && <div className="fact__note">{note}</div>}
  </div>
);

export const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  size = 'md',
  suffix,
  width,
  inputMode,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  size?: 'md' | 'num' | 'big';
  suffix?: ReactNode;
  width?: number | string;
  inputMode?: 'numeric' | 'decimal';
}) => (
  <label className="field" style={{ width }}>
    <span className="field__label">{label}</span>
    <div className="row center gap-10">
      <input
        className={
          'field__input' +
          (size === 'big' ? ' field__input--big' : size === 'num' ? ' field__input--num' : '')
        }
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={width ? { width } : undefined}
      />
      {suffix && <span className="mono-cond" style={{ fontSize: 30, color: '#416180' }}>{suffix}</span>}
    </div>
  </label>
);

export const SectionRow = ({ children }: { children: ReactNode }) => (
  <div className="row-item">{children}</div>
);
