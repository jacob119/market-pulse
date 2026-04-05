/**
 * 미니 캔들 컴포넌트 — 현재가 옆에 작은 캔들차트 표시
 * 한국식: 상승=빨강, 하락=파랑
 */
export function MiniCandle({ open, close, high, low }: { open: number; close: number; high: number; low: number }) {
  const isUp = close >= open
  const color = isUp ? "#ef4444" : "#3b82f6"
  const glow = isUp ? "drop-shadow(0 0 3px #ef444488)" : "drop-shadow(0 0 3px #3b82f688)"
  const h = 36
  const w = 20
  const range = high - low || 1
  const bodyTop = Math.max(open, close)
  const bodyBottom = Math.min(open, close)
  const bodyHeight = Math.max(((bodyTop - bodyBottom) / range) * (h - 4), 6)
  const bodyY = ((high - bodyTop) / range) * (h - 4) + 2

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" style={{ filter: glow }}>
      <line x1={w/2} y1={2} x2={w/2} y2={bodyY} stroke={color} strokeWidth="1.5" />
      <rect x={3} y={bodyY} width={w - 6} height={bodyHeight} fill={color} rx="2" />
      <line x1={w/2} y1={bodyY + bodyHeight} x2={w/2} y2={h - 2} stroke={color} strokeWidth="1.5" />
    </svg>
  )
}
