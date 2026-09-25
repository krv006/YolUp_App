/**
 * `analytics` modulining mobil barrel'i.
 *
 * Veb `src/modules/analytics/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { analyticsApi } from "./api/analytics.api";
export { analyticsEndpoints } from "./api/analytics.endpoints";
export type {
  DashboardPeriodDto,
  DashboardSummaryDto,
  DashboardTrendsDto,
  TopCourseDto,
  TopTeacherDto,
} from "./api/analytics.dto";
export {
  mapDashboardSummaryDto,
  mapDashboardTrendsDto,
  mapTopCourseDto,
  mapTopTeacherDto,
} from "./lib/analytics.mappers";
export {
  analyticsKeys,
  useDashboardSummary,
  useDashboardTrends,
  useMonitoringCurrent,
  useMonitoringHistory,
  useMyAnalytics,
  useTeacherVideoStats,
} from "./model/analytics.queries";

// --- Mobil UI ---
export { TrendLineChart } from "./ui/trend-line-chart";
export type { TrendLineChartProps, TrendLineSeries } from "./ui/trend-line-chart";
export { TrendStackedBarChart } from "./ui/trend-stacked-bar-chart";
export type { TrendBarSeries, TrendStackedBarChartProps } from "./ui/trend-stacked-bar-chart";
