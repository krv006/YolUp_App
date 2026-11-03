import { ProfileEditMobile, ProfileInfoMobile } from "./settings-mobile-profile";
import { PasswordMobile, SecurityMobile, SettingsMobile } from "./settings-mobile-system";

/** Veb `parent-settings-page.tsx` (telefon): `/parent/settings/:section` bo'yicha sahifa. */
export function ParentSettingsPage({ section }: { section?: string }) {
  if (section === "profile") return <ProfileInfoMobile />;
  if (section === "edit") return <ProfileEditMobile />;
  if (section === "security") return <SecurityMobile />;
  if (section === "password") return <PasswordMobile />;
  return <SettingsMobile />;
}
