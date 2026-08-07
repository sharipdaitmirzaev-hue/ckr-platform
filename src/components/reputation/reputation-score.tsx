import { Badge } from "@/components/ui/badge";
import { reputationVerificationLevelLabels } from "@/config/reputation";
import { cn } from "@/lib/utils";
import type { ReputationProfile } from "@/types";

type ReputationScoreProps = {
  profile: ReputationProfile;
  className?: string;
};

export function ReputationScore({ profile, className }: ReputationScoreProps) {
  const scoreLabel =
    profile.score > 0 ? profile.score.toFixed(1) : "—";

  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-4",
        className,
      )}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Рейтинг
        </p>
        <p className="mt-1 font-display text-2xl font-semibold text-foreground">
          {scoreLabel}
          <span className="ml-1 text-sm font-normal text-muted">/ 5</span>
        </p>
        <p className="mt-1 text-xs text-muted">
          {profile.reviewsCount}{" "}
          {profile.reviewsCount === 1 ? "отзыв" : "отзывов"}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Уровень доверия
        </p>
        <div className="mt-2">
          <Badge variant="accent">
            {reputationVerificationLevelLabels[profile.verificationLevel]}
          </Badge>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Проекты
        </p>
        <p className="mt-1 font-display text-2xl font-semibold text-foreground">
          {profile.completedProjects}
        </p>
        <p className="mt-1 text-xs text-muted">опубликованных</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Сделки
        </p>
        <p className="mt-1 font-display text-2xl font-semibold text-foreground">
          {profile.completedDeals}
        </p>
        <p className="mt-1 text-xs text-muted">завершённых</p>
      </div>
    </div>
  );
}
