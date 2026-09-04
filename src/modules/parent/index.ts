/**
 * `parent` modulining mobil barrel'i.
 *
 * Veb `src/modules/parent/index.ts` dan generatsiya qilingan (scripts/port-barrels.mjs):
 * domen qatlami to'liq, `ui/` eksportlari olib tashlangan — mobil UI alohida
 * yoziladi va o'z fayllaridan import qilinadi.
 */
export { parentApi } from "./api/parent.api";
export type {
  Consent,
  ConsentDto,
  ConsentKind,
  LinkStatus,
  ParentChild,
  ParentDashboard,
  ParentLink,
  ParentLinkDto,
  SetConsentInput,
} from "./api/parent.dto";
export { createParentDashboard, mapChildFromLink, mapParentLinkDto } from "./lib/parent.mappers";
export {
  parentKeys,
  useParentDashboard,
  useParentChildren,
  useParentHomework,
  useParentLinks,
  useParentConsents,
  useRequestChildLink,
  useCreateChild,
  useRespondParentLink,
  useSetParentConsent,
} from "./model/parent.queries";
export { useSelectedChild, useSelectedChildStore } from "./model/selected-child.store";
export type { UseSelectedChildResult } from "./model/selected-child.store";

// --- Mobil UI ---
export { ChildSelector, SelectedChildHeader } from "./ui/child-selector";
