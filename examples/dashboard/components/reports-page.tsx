"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, TrendingUp, Globe, BarChart3, Home, Coins, Building2, PieChart, X, Maximize2, Landmark, Gem, CandlestickChart, MapPin, Crown, Clock, Activity, Users, Fuel, Swords, Brain, Wallet, CalendarDays } from "lucide-react"

// Next.js public 디렉토리 기준 경로
const MACRO_BASE = "/reports/macro"
const SPECIAL_BASE = "/reports/special"
const STOCKS_BASE = "/reports/stocks"

interface ReportLink {
  name: string
  file: string
  icon: any
  color: string
  description: string
}

const MACRO_REPORTS: ReportLink[] = [
  { name: "거시경제 분석", file: "macro_economy_report.html", icon: Landmark, color: "text-sky-400", description: "금리, GDP, 인플레이션, 환율, 지정학" },
  { name: "원자재 분석", file: "commodity_report.html", icon: Gem, color: "text-amber-400", description: "금, 은, 원유, 구리, 중앙은행" },
  { name: "주식시장 분석", file: "stock_market_report.html", icon: CandlestickChart, color: "text-rose-400", description: "S&P500, KOSPI, 종목 추천 30개" },
  { name: "부동산 분석", file: "real_estate_report.html", icon: MapPin, color: "text-emerald-400", description: "서울 권역별, REITs, 글로벌" },
  { name: "종합 투자 분석", file: "final_investment_report.html", icon: Crown, color: "text-violet-400", description: "4개 분야 종합, 포트폴리오 전략" },
  { name: "매수 타이밍 전략", file: "timing_strategy_report.html", icon: Clock, color: "text-orange-400", description: "이벤트 캘린더, 분할매수 계획" },
]

const SPECIAL_REPORTS: ReportLink[] = [
  { name: "코스피 종합 분석", file: "kospi_market_analysis_report.html", icon: Activity, color: "text-indigo-400", description: "외국인/기관, 섹터, 환율" },
  { name: "외국인 매도 분석", file: "foreign_selling_analysis_report.html", icon: Users, color: "text-pink-400", description: "매도 타임라인, 복귀 시그널" },
  { name: "유가 급등 영향", file: "oil_surge_impact_report.html", icon: Fuel, color: "text-amber-500", description: "시나리오별 대응 전략" },
  { name: "전쟁 비교 분석", file: "war_historical_comparison_report.html", icon: Swords, color: "text-red-400", description: "1973/1990/2003 vs 2026" },
]

export function ReportsPage() {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  const [iframeTitle, setIframeTitle] = useState("")

  const openReport = (base: string, file: string, title: string) => {
    setIframeSrc(`${base}/${file}`)
    setIframeTitle(title)
  }
  const openMacro = (file: string, title?: string) => openReport(MACRO_BASE, file, title ?? file)
  const openSpecial = (file: string, title?: string) => openReport(SPECIAL_BASE, file, title ?? file)
  const openStock = (file: string, title?: string) => openReport(STOCKS_BASE, file, title ?? file)

  // iframe으로 리포트 표시 중이면 뷰어 렌더링
  if (iframeSrc) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setIframeSrc(null)} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-bold text-foreground">{iframeTitle}</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.open(iframeSrc, '_blank')}>
            <Maximize2 className="w-4 h-4 mr-2" />
            새 탭에서 열기
          </Button>
        </div>
        <Card className="border-border/50 overflow-hidden">
          <iframe
            src={iframeSrc}
            className="w-full border-0"
            style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <FileText className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Investment Alpha 리포트</h2>
            <p className="text-sm text-muted-foreground">6인 전문가 에이전트 팀의 종합 투자 분석</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary/10"
            onClick={() => window.open('/reports/index_reports.html', '_blank')}
          >
            <Home className="w-3 h-3 mr-1" /> 리포트 목록
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary/10"
            onClick={() => window.open('/reports/calendar.html', '_blank')}
          >
            📅 캘린더 대시보드
          </Badge>
        </div>
      </div>

      {/* 매크로 리포트 */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Landmark className="w-5 h-5 text-sky-400" />
            매크로 분석 리포트 (4인 전문가 + 종합)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {MACRO_REPORTS.map((report) => {
              const Icon = report.icon
              return (
                <div
                  key={report.file}
                  className="group p-4 rounded-xl border border-border/30 bg-card hover:bg-muted/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                  onClick={() => openMacro(report.file, report.name)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br from-current/10 to-current/5 ${report.color.replace('text-', 'bg-').replace('-400', '-500/15').replace('-500', '-500/15')}`}>
                      <Icon className={`w-5 h-5 ${report.color}`} />
                    </div>
                    <span className="font-semibold text-sm text-foreground">{report.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground pl-11">{report.description}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 특별 분석 */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Swords className="w-5 h-5 text-rose-400" />
            특별 분석 리포트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SPECIAL_REPORTS.map((report) => {
              const Icon = report.icon
              return (
                <div
                  key={report.file}
                  className="group p-4 rounded-xl border border-border/30 bg-card hover:bg-muted/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                  onClick={() => openSpecial(report.file, report.name)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${report.color.replace('text-', 'bg-').replace('-400', '-500/15').replace('-500', '-500/15')}`}>
                      <Icon className={`w-5 h-5 ${report.color}`} />
                    </div>
                    <span className="font-semibold text-sm text-foreground">{report.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground pl-11">{report.description}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 종목 분석 리포트 */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-400" />
            AI 종목 분석 리포트 (Claude Sonnet 4)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {["SK하이닉스", "삼성전자", "네이버"].map((name) => {
              const code = name === "SK하이닉스" ? "000660" : name === "삼성전자" ? "005930" : "035420"
              const file = `${code}_${name}_20260404.html`
              return (
                <div
                  key={code}
                  className="group p-4 rounded-xl border border-border/30 bg-card hover:bg-muted/20 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer"
                  onClick={() => openStock(file, name)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-500/15">
                      <Brain className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="font-semibold text-sm text-foreground">{name} ({code})</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground pl-11">5개 에이전트 병렬 분석 + 투자 전략</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 월별 리포트 */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-teal-400" />
            월별 종합 리포트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              className="group p-4 rounded-xl border border-border/30 bg-card hover:bg-muted/20 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 cursor-pointer"
              onClick={() => openMacro("monthly_report_2026-03.html", "2026년 3월 월별 종합 리포트")}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-teal-500/15">
                  <CalendarDays className="w-5 h-5 text-teal-400" />
                </div>
                <span className="font-semibold text-sm text-foreground">2026년 3월 월별 종합 리포트</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto group-hover:text-teal-400 transition-colors" />
              </div>
              <p className="text-xs text-muted-foreground pl-11">매매 실적 + 시장 분석 + 포트폴리오 + 전략</p>
            </div>
            <div
              className="group p-4 rounded-xl border border-border/30 bg-card hover:bg-muted/20 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 cursor-pointer"
              onClick={() => openMacro("portfolio_analysis_report.html", "포트폴리오 종합 분석")}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-cyan-500/15">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="font-semibold text-sm text-foreground">포트폴리오 종합 분석</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto group-hover:text-cyan-400 transition-colors" />
              </div>
              <p className="text-xs text-muted-foreground pl-11">15종목 현재가, 수익률, 리밸런싱 권고</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
