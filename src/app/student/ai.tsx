import { Screen, ScreenEmpty } from "@/shared/ui";
import { useTranslation } from "react-i18next";

/** Faza 3 */
export default function StudentAiRoute() {
  const { t } = useTranslation("mobile");
  return (
    <Screen>
      <ScreenEmpty title={t("app.ai_yordamchi")} description={t("app.bu_bolim_faza_3_da_qoshiladi")} />
    </Screen>
  );
}
