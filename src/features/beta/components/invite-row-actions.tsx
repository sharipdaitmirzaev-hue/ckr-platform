import { Button } from "@/components/ui/button";
import {
  expireInviteAction,
  markInviteCompletedAction,
  markInviteSentAction,
} from "@/features/beta/actions";
import type { BetaInvite } from "@/types";

type InviteRowActionsProps = {
  invite: BetaInvite;
};

export function InviteRowActions({ invite }: InviteRowActionsProps) {
  const canSend =
    invite.status === "created" || invite.status === "invited";
  const canComplete =
    invite.status === "activated" || invite.status === "used";
  const canExpire =
    invite.status === "created" ||
    invite.status === "sent" ||
    invite.status === "invited" ||
    invite.status === "activated" ||
    invite.status === "used";

  if (!canSend && !canExpire && !canComplete) {
    return <span className="text-xs text-muted">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canSend ? (
        <form action={markInviteSentAction}>
          <input type="hidden" name="inviteId" value={invite.id} />
          <Button type="submit" size="sm" variant="secondary">
            Отправлено
          </Button>
        </form>
      ) : null}
      {canComplete ? (
        <form action={markInviteCompletedAction}>
          <input type="hidden" name="inviteId" value={invite.id} />
          <Button type="submit" size="sm" variant="secondary">
            Сценарий завершён
          </Button>
        </form>
      ) : null}
      {canExpire ? (
        <form action={expireInviteAction}>
          <input type="hidden" name="inviteId" value={invite.id} />
          <Button type="submit" size="sm" variant="outline">
            Отключить
          </Button>
        </form>
      ) : null}
    </div>
  );
}
