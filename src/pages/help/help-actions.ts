import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useHelpPaths } from "./use-help";

export interface NewTicketPrefill {
  category?: string;
}

/**
 * Yangi murojaat ochish — veb `help-actions.ts` (`HelpActionsContext`).
 *
 * 🟡 Vebda kontekst: kompyuterda oyna, telefonda `/new` sahifasi. Mobilda
 * har doim sahifa, shuning uchun kontekst kerak emas — har bir yordam
 * ekrani (alohida marshrut) shu hook bilan `/new?category=` ni ochadi.
 */
export function useHelpActions() {
  const router = useRouter();
  const paths = useHelpPaths();
  const openNewTicket = useCallback(
    (prefill: NewTicketPrefill = {}) =>
      router.push((prefill.category ? `${paths.newTicket}?category=${encodeURIComponent(prefill.category)}` : paths.newTicket) as never),
    [router, paths.newTicket]
  );
  return { openNewTicket };
}
