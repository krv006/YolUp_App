export { supportApi } from "./api/support.api";
export type {
  FaqItem,
  HelpConfig,
  HelpVideo,
  SupportAttachment,
  SupportMessage,
  SupportRating,
  SupportTicket,
  SupportTicketStatus,
  TicketDraft,
} from "./api/support.dto";
export {
  supportKeys,
  useCloseSupportTicket,
  useCreateSupportTicket,
  useCreateTicketDraft,
  useHelpConfig,
  useRateSupportTicket,
  useSendArticleFeedback,
  useHelpFaq,
  useHelpVideos,
  useReplySupportTicket,
  useSupportTicket,
  useSupportTickets,
} from "./model/support.queries";
export * from "./content/help-content";
export * from "./lib/help-search";
export * from "./lib/ticket-helpers";

// --- Mobil UI ---
// Veb `SupportThread` (admin, xodim ko'rinishi) mobilda `SupportDialog staffView` ichida;
// foydalanuvchi murojaatlari endi Yordam markazi sahifalarida (`pages/help`).
export { SupportDialog } from "./ui/support-dialog";
export type { SupportDialogProps } from "./ui/support-dialog";
