import { useLocalSearchParams } from "expo-router";
import { HelpTicketThread } from "@/pages/help/help-tickets";

export default function ParentHelpTicketRoute() {
  const { ticketId = "" } = useLocalSearchParams<{ ticketId: string }>();
  return <HelpTicketThread key={ticketId} ticketId={ticketId} />;
}
