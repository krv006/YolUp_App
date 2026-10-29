export { supportApi } from "./api/support.api";
export type { FaqItem, HelpVideo, SupportMessage, SupportTicket, SupportTicketStatus } from "./api/support.dto";
export {
  supportKeys,
  useCloseSupportTicket,
  useCreateSupportTicket,
  useHelpFaq,
  useHelpVideos,
  useReplySupportTicket,
  useSupportTicket,
  useSupportTickets,
} from "./model/support.queries";
