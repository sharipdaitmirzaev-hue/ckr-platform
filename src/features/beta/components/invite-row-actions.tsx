import { Button } from "@/components/ui/button";
import {
  expireInviteAction,
  markInviteActiveAction,
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
  const canActivate =
    invite.status === "activated" || invite.status === "used";
  const canComplete =
    invite.status === "activated" ||
    invite.status === "active" ||
    invite.status === "used";
  const canExpire =
    invite.status === "created" ||
    invite.status === "sent" ||
    invite.status === "invited" ||
    invite.status === "activated" ||
    invite.status === "active" ||
    invite.status === "used";

  if (!canSend && !canExpire && !canComplete && !canActivate) {
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
      {canActivate ? (
        <form action={markInviteActiveAction}>
          <input type="hidden" name="inviteId" value={invite.id} />
          <Button type="submit" size="sm" variant="secondary">
            Активен
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
