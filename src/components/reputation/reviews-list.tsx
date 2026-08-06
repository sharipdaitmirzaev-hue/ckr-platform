import { Badge } from "@/components/ui/badge";
import { reviewTargetTypeLabels } from "@/config/reputation";
import type { Review } from "@/types";

type ReviewsListProps = {
  reviews: Review[];
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="tabular-nums text-accent" aria-label={`Оценка ${rating} из 5`}>
      {"★".repeat(rating)}
      <span className="text-muted">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted">Отзывов пока нет.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-sm border border-border bg-background/40 px-4 py-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Stars rating={review.rating} />
            <Badge variant="soft">
              {reviewTargetTypeLabels[review.targetType]}
            </Badge>
            {review.authorName ? (
              <span className="text-sm text-muted">{review.authorName}</span>
            ) : null}
            {review.createdAt ? (
              <span className="text-xs text-muted">
                {new Date(review.createdAt).toLocaleDateString("ru-RU")}
              </span>
            ) : null}
          </div>
          {review.comment ? (
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {review.comment}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
