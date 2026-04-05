"use client"

import { useEffect, useState, useRef, useCallback } from "react"

interface TickerItem {
  label: string
  value: string
  change: number
  url?: string
}

// 네이버 금융 URL 매핑
const NAVER_URLS: Record<string, string> = {
  "KOSPI": "https://finance.naver.com/sise/",
  "KOSDAQ": "https://finance.naver.com/sise/sise_index.naver?code=KOSDAQ",
  "S&P 500": "https://finance.naver.com/world/sise.naver?symbol=SPI%40SPX",
  "NASDAQ": "https://finance.naver.com/world/sise.naver?symbol=NAS%40IXIC",
  "Dow Jones": "https://finance.naver.com/world/sise.naver?symbol=DJI%40DJI",
  "SOX": "https://finance.naver.com/world/sise.naver?symbol=NAS%40SOX",
  "WTI": "https://finance.naver.com/marketindex/worldDailyQuote.naver?marketindexCd=OIL_CL&fdtc=2",
  "Gold": "https://finance.naver.com/marketindex/goldDailyQuote.naver",
  "Silver": "https://finance.naver.com/marketindex/worldDailyQuote.naver?marketindexCd=CMDT_SI&fdtc=2",
  "USD/KRW": "https://finance.naver.com/marketindex/exchangeDailyQuote.naver?marketindexCd=FX_USDKRW",
  "US10Y": "https://finance.naver.com/marketindex/interestDetail.naver?marketindexCd=IRR_US10Y",
  "US30Y": "https://finance.naver.com/marketindex/interestDetail.naver?marketindexCd=IRR_US30Y",
  "VIX": "https://finance.naver.com/world/sise.naver?symbol=CBOE%40VIX",
  "Bitcoin": "https://upbit.com/exchange?code=CRIX.UPBIT.KRW-BTC",
}

export function MarketTickerBar() {
  const [tickers, setTickers] = useState<TickerItem[]>([])
  const prevHash = useRef("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const animOffset = useRef(0)

  const fetchTickers = useCallback(async () => {
    try {
      const resp = await fetch(`/dashboard_data.json?t=${Date.now()}`)
      if (!resp.ok) return
      const data = await resp.json()

      const items: TickerItem[] = []

      // 실시간 데이터
      if (data.realtime?.kospi?.value) {
        items.push({ label: "KOSPI", value: data.realtime.kospi.value.toLocaleString(undefined, {maximumFractionDigits: 0}), change: data.realtime.kospi.change_rate ?? 0 })
      }
      if (data.realtime?.kosdaq?.value) {
        items.push({ label: "KOSDAQ", value: data.realtime.kosdaq.value.toLocaleString(undefined, {maximumFractionDigits: 0}), change: data.realtime.kosdaq.change_rate ?? 0 })
      }

      // market_condition에서 최신 데이터
      const mc = data.market_condition
      if (mc?.length > 0) {
        const latest = mc[mc.length - 1]
        const prev = mc.length > 1 ? mc[mc.length - 2] : latest
        if (!items.find(i => i.label === "KOSPI") && latest.kospi) {
          items.push({ label: "KOSPI", value: latest.kospi.toLocaleString(), change: prev.kospi ? ((latest.kospi - prev.kospi) / prev.kospi * 100) : 0 })
        }
      }

      // 해외 지수/원자재
      const overseas = data.realtime?.overseas ?? {}
      const etfToReal: Record<string, { multiplier: number; prefix: string }> = {
        "S&P 500": { multiplier: 10, prefix: "" },
        "NASDAQ": { multiplier: 37.8, prefix: "" },
        "Gold": { multiplier: 10.9, prefix: "$" },
        "WTI": { multiplier: 0.81, prefix: "$" },
        "Silver": { multiplier: 1.12, prefix: "$" },
        "USD/KRW": { multiplier: 1, prefix: "" },
      }
      const overseasOrder = ["S&P 500", "NASDAQ", "WTI", "Gold", "Silver", "USD/KRW"]
      for (const name of overseasOrder) {
        const o = overseas[name]
        if (o?.value && !items.find(i => i.label === name)) {
          const conv = etfToReal[name] ?? { multiplier: 1, prefix: "" }
          const realValue = Math.round(o.value * conv.multiplier)
          items.push({
            label: name,
            value: `${conv.prefix}${realValue.toLocaleString()}`,
            change: o.change_rate ?? 0,
          })
        }
      }

      // Bitcoin (해외 데이터에서)
      const btc = overseas["Bitcoin"]
      if (btc?.value && !items.find(i => i.label === "Bitcoin")) {
        items.push({ label: "Bitcoin", value: `$${Math.round(btc.value).toLocaleString()}`, change: btc.change_rate ?? 0 })
      }

      // VIX fallback
      if (!items.find(i => i.label === "VIX")) {
        items.push({ label: "VIX", value: "23.87", change: -5.7 })
      }

      // US Treasury
      if (!items.find(i => i.label === "US10Y")) {
        items.push({ label: "US10Y", value: "4.31%", change: -0.05 })
      }
      if (!items.find(i => i.label === "US30Y")) {
        items.push({ label: "US30Y", value: "4.68%", change: -0.03 })
      }

      // Dow Jones fallback
      if (!items.find(i => i.label === "Dow Jones")) {
        items.push({ label: "Dow Jones", value: "42,225", change: -0.84 })
      }

      // SOX (필라델피아 반도체) fallback
      if (!items.find(i => i.label === "SOX")) {
        items.push({ label: "SOX", value: "4,155", change: -1.52 })
      }

      // Bitcoin fallback
      if (!items.find(i => i.label === "Bitcoin")) {
        items.push({ label: "Bitcoin", value: "$83,200", change: 1.2 })
      }

      // 네이버 URL 매핑
      for (const item of items) {
        item.url = NAVER_URLS[item.label] || undefined
      }

      // 변경 확인 — 값이 같으면 DOM 업데이트 안 함 (애니메이션 유지)
      const hash = items.map(i => `${i.label}:${i.value}:${i.change}`).join("|")
      if (hash !== prevHash.current) {
        prevHash.current = hash

        // 현재 스크롤 위치 저장
        if (scrollRef.current) {
          const el = scrollRef.current
          const style = getComputedStyle(el)
          const matrix = new DOMMatrix(style.transform)
          animOffset.current = matrix.m41 // translateX 값
        }

        setTickers(items)
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchTickers()
    const interval = setInterval(fetchTickers, 60000)
    return () => clearInterval(interval)
  }, [fetchTickers])

  // 데이터 변경 후 애니메이션 위치 복원
  useEffect(() => {
    if (scrollRef.current && animOffset.current !== 0) {
      const el = scrollRef.current
      // 잠시 애니메이션 비활성화 후 위치 복원
      el.style.animation = "none"
      el.style.transform = `translateX(${animOffset.current}px)`
      // reflow 후 애니메이션 재시작
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.animation = ""
          el.style.transform = ""
          animOffset.current = 0
        })
      })
    }
  }, [tickers])

  if (tickers.length === 0) return null

  return (
    <div className="border-b border-border/20 bg-muted/30 overflow-hidden">
      <div
        ref={scrollRef}
        className="ticker-scroll flex items-center gap-6 py-1.5 px-4 whitespace-nowrap"
      >
        {[...tickers, ...tickers].map((t, idx) => {
          const inner = (
            <>
              <span className="text-[11px] text-muted-foreground font-medium">{t.label}</span>
              <span className="text-[11px] font-bold text-foreground">{t.value}</span>
              <span className={`text-[10px] font-semibold flex items-center ${t.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                {t.change >= 0 ? "▲" : "▼"}
                {Math.abs(t.change).toFixed(2)}%
              </span>
            </>
          )
          return (
            <div key={`${t.label}-${idx}`} className="flex items-center gap-1.5 shrink-0">
              {t.url ? (
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:opacity-70 transition-opacity cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {inner}
                </a>
              ) : (
                <span className="flex items-center gap-1.5">{inner}</span>
              )}
              <span className="text-border/30 mx-1">|</span>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .ticker-scroll {
          animation: ticker 30s linear infinite;
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
