import { Screen, ScreenEmpty } from "@/shared/ui";
import { PublicRoute } from "@/providers/route-guards";

/** Ro'yxatdan o'tish formasi Faza 1 da (veb `register-form.tsx` porti). */
export default function RegisterRoute() {
  return (
    <PublicRoute>
      <Screen>
        <ScreenEmpty
          title="Ro'yxatdan o'tish"
          description="Bu ekran Faza 1 da qo'shiladi. Hozircha mavjud hisob bilan kiring."
        />
      </Screen>
    </PublicRoute>
  );
}
