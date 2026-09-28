import { apiClient, type RequestOptions } from "@/shared/api";
import { mockTestEndpoints } from "./mock-test.endpoints";
import type { MockSubmitInput, MockTestFormValues } from "./mock-test.dto";
import {
  mapMockAttempt,
  mapMockAttemptResult,
  mapMockTestDetail,
  mapMockTestPage,
  mapMockTestRequest,
} from "../lib/mock-test.mappers";

export const mockTestApi = {
  async getAll(options: RequestOptions = {}) {
    return mapMockTestPage(await apiClient.get(mockTestEndpoints.list, options), options.query);
  },

  async getOne(id: string, options?: RequestOptions) {
    return mapMockTestDetail(await apiClient.get(mockTestEndpoints.detail(id), options));
  },

  async create(form: MockTestFormValues) {
    return mapMockTestDetail(await apiClient.post(mockTestEndpoints.list, mapMockTestRequest(form)));
  },

  remove(id: string) {
    return apiClient.delete(mockTestEndpoints.detail(id));
  },

  async start(id: string) {
    return mapMockAttempt(await apiClient.post(mockTestEndpoints.start(id), {}));
  },

  async submit(id: string, attemptId: string, payload: MockSubmitInput) {
    return mapMockAttemptResult(await apiClient.post(mockTestEndpoints.submit(id, attemptId), payload));
  },
};
