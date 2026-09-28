/**
 * `mock-test` modulining mobil barrel'i.
 *
 * Veb `src/modules/mock-test/index.ts` dan generatsiya qilingan
 * (scripts/port-barrels.mjs): domen qatlami to'liq, `ui/` eksportlari
 * olib tashlangan — mobil UI alohida yoziladi.
 *
 * `MockTestCreateDialog` KO'CHIRILMADI: u vebda ham hech qayerda
 * ishlatilmaydi (barrel'dan eksport qilingan, lekin chaqiruvchisi yo'q).
 * Mock testlar hozircha faqat backend tomondan yaratiladi.
 */
export { mockTestApi } from "./api/mock-test.api";
export { mockTestEndpoints } from "./api/mock-test.endpoints";
export type {
  MockAttempt,
  MockAttemptQuestion,
  MockAttemptResult,
  MockAttemptSection,
  MockTestDetail,
  MockTestFormValues,
  MockTestSection,
  MockTestSummary,
} from "./api/mock-test.dto";
export {
  mockTestKeys,
  useCreateMockTest,
  useDeleteMockTest,
  useMockTest,
  useMockTests,
  useStartMockTest,
  useSubmitMockTest,
} from "./model/mock-test.queries";

// --- Mobil UI ---
export { MockTestRunner } from "./ui/mock-test-runner";
export type { MockTestRunnerProps } from "./ui/mock-test-runner";
