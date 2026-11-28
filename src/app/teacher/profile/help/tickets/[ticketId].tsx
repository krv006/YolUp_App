import { useLocalSearchParams } from "expo-router";
import { HelpTicketThread } from "@/pages/help/help-tickets";

export default function TeacherHelpTicketRoute() {
  const { ticketId = "" } = useLocalSearchParams<{ ticketId: string }>();
  return <HelpTicketThread key={ticketId} ticketId={ticketId} />;
}
