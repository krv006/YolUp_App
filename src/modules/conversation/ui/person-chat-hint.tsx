import { useTranslation } from "react-i18next";
import { DsText, Icon, useDs } from "@/shared/ui";
import type { DirectChatAction } from "../model/use-start-direct-chat";

/**
 * Qidiruvdagi odam qatorining o'ng tomoni — veb `person-chat-hint.tsx`:
 * suhbat bor bo'lsa strelka, aks holda "Suhbat ochish", "So'rov yuborish"
 * yoki "Faqat ko'rish" (`can_message` bo'yicha).
 */
export function PersonChatHint({ action }: { action: DirectChatAction }) {
  const { t } = useTranslation("chat");
  const ds = useDs();
  if (action === "open") return <Icon name="chevron-right" size={18} color={ds.c["icon-tertiary"]} />;
  if (action === "none")
    return (
      <DsText v="body-xs" c="ink-tertiary">
        {t("people.viewOnly")}
      </DsText>
    );
  return (
    <DsText v="body-xs" c="brand">
      {action === "write" ? t("panel.startChat") : t("people.sendRequest")}
    </DsText>
  );
}
