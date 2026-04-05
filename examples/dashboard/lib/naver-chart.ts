/**
 * 종목코드에 대해 네이버 금융 차트 URL을 반환합니다.
 * - 6자리 숫자 (코스피/코스닥): 네이버 금융 차트
 * - 영문+숫자 혼합 ETF (0036R0 등): 네이버 금융 차트
 * - 특수 티커 (GOLD 등): null
 */
export function getNaverChartUrl(ticker: string): string | null {
  if (!ticker) return null

  // 6자리 숫자 (일반 종목, ETF)
  if (/^\d{6}$/.test(ticker)) {
    return `https://finance.naver.com/item/fchart.naver?code=${ticker}`
  }

  // 영문+숫자 혼합 코드 (예: 0036R0) — 네이버에서 지원
  if (/^\d{3,4}[A-Z]\d$/.test(ticker)) {
    return `https://finance.naver.com/item/fchart.naver?code=${ticker}`
  }

  // GOLD 등 특수 티커 → 링크 없음
  return null
}
