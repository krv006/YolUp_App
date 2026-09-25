import { apiClient, type RequestOptions } from "@/shared/api";
import type { DashboardPeriod } from "@/shared/types";
import { analyticsEndpoints } from "./analytics.endpoints";
import type { DashboardSummaryDto, DashboardTrendsDto } from "./analytics.dto";
import {
  mapDashboardSummaryDto,
  mapDashboardTrendsDto,
  mapMonitoringHistory,
  mapMonitoringSample,
  mapMyAnalytics,
  mapTeacherVideoStats,
} from "../lib/analytics.mappers";

export const analyticsApi = {
  async getDashboardSummary(options?: RequestOptions) {
    return mapDashboardSummaryDto(
      await apiClient.get<DashboardSummaryDto>(analyticsEndpoints.summary, options)
    );
  },
  async getDashboardTrends(period: DashboardPeriod, options: RequestOptions = {}) {
    return mapDashboardTrendsDto(
      await apiClient.get<DashboardTrendsDto>(analyticsEndpoints.trends, { ...options, query: { period } })
    );
  },

  async getMyAnalytics(options?: RequestOptions) {
    return mapMyAnalytics(await apiClient.get(analyticsEndpoints.me, options));
  },

  async getTeacherVideoStats(options?: RequestOptions) {
    return mapTeacherVideoStats(await apiClient.get(analyticsEndpoints.teacherVideoStats, options));
  },

  async getMonitoringCurrent(options?: RequestOptions) {
    return mapMonitoringSample(await apiClient.get(analyticsEndpoints.monitoringCurrent, options));
  },

  async getMonitoringHistory(hours: number, options: RequestOptions = {}) {
    return mapMonitoringHistory(
      await apiClient.get(analyticsEndpoints.monitoringHistory, { ...options, query: { hours } })
    );
  },
};
