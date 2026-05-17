interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function StatCard({ icon, label, value, sub, color = 'var(--color-gold)' }: StatCardProps) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid rgba(200,169,110,0.12)',
      borderRadius: 14,
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flex: '1 1 160px',
      minWidth: 140,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}18`,
        border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-ivory)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-ivory-faint)', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}
