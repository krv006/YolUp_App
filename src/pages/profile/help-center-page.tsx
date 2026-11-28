import { Redirect, useLocalSearchParams } from "expo-router";
import { HelpHome } from "@/pages/help/help-home";
import { useHelpPaths } from "@/pages/help/use-help";

/**
 * Yordam markazi — veb `help-center-page.tsx` (2026-11-28 yangi dizayn).
 *
 * Vebda bitta sahifa ichida ichki `Routes` bor; mobilda har bir bo'lim
 * alohida marshrut (`app/<rol>/profile/help/...`), bu esa bosh sahifa.
 * Eski bildirishnoma havolasi `?ticket=<id>` murojaat sahifasiga o'tadi.
 */
export function HelpCenterPage() {
  const paths = useHelpPaths();
  const { ticket } = useLocalSearchParams<{ ticket?: string }>();
  if (ticket) return <Redirect href={paths.ticket(ticket) as never} />;
  return <HelpHome />;
}
