import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useCreateChannel, useNewConversationStore } from "@/modules/conversation";
import { useCreateClub } from "@/modules/course";
import { ROUTES } from "@/shared/config";
import { MobileRoundButton, PopoverMenu, PopoverMenuItem, toast, usePopoverAnchor } from "@/shared/ui";
import { CreateAudienceDialog } from "./create-audience-dialog";

const ITEMS = [
  { id: "group", icon: "groups" },
  { id: "channel", icon: "campaign" },
  { id: "club", icon: "mic" },
] as const;

/**
 * O'qituvchining "+" tugmasi — veb `new-chat-menu.tsx`: yangi guruh,
 * yangi kanal yoki speaking club. Kanal va club o'z oynasida yaratiladi,
 * keyin chati ochiladi.
 */
export function NewChatMenu() {
  const { t } = useTranslation("chat");
  const router = useRouter();
  const openGroup = useNewConversationStore((state) => state.setOpen);
  const { anchorRef, rect, open, close } = usePopoverAnchor();
  const [dialog, setDialog] = useState<"channel" | "club" | null>(null);
  const createChannel = useCreateChannel();
  const createClub = useCreateClub();

  function run(id: (typeof ITEMS)[number]["id"]) {
    close();
    if (id === "group") openGroup(true);
    else setDialog(id);
  }

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        <MobileRoundButton icon="add" iconSize={24} label={t("create.menuAria")} onPress={open} />
      </View>
      <PopoverMenu rect={rect} onClose={close} height={ITEMS.length * 56}>
        {ITEMS.map((item) => (
          <PopoverMenuItem key={item.id} icon={item.icon} label={t(`create.menu.${item.id}`)} onPress={() => run(item.id)} />
        ))}
      </PopoverMenu>

      <CreateAudienceDialog
        open={dialog === "channel"}
        onOpenChange={(next) => setDialog(next ? "channel" : null)}
        kind="channel"
        pending={createChannel.isPending}
        onSubmit={(values, reset) =>
          createChannel.mutate(values, {
            onSuccess: (room) => {
              toast.success(t("create.channel.done"));
              reset();
              setDialog(null);
              router.push(ROUTES.teacher.chat(room.id) as never);
            },
            onError: (error: Error) => toast.error(error.message),
          })
        }
      />
      <CreateAudienceDialog
        open={dialog === "club"}
        onOpenChange={(next) => setDialog(next ? "club" : null)}
        kind="club"
        pending={createClub.isPending}
        onSubmit={(values, reset) =>
          createClub.mutate(values, {
            onSuccess: (club) => {
              toast.success(t("create.club.done"));
              reset();
              setDialog(null);
              if (club.chatRoomId) router.push(ROUTES.teacher.chat(club.chatRoomId) as never);
            },
            onError: (error: Error) => toast.error(error.message),
          })
        }
      />
    </>
  );
}
