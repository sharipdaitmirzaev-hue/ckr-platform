import { Button } from "@/components/ui/button";
import { archiveOpportunityAction } from "@/features/opportunities/actions";

type ArchiveOpportunityButtonProps = {
  opportunityId: string;
};

export function ArchiveOpportunityButton({
  opportunityId,
}: ArchiveOpportunityButtonProps) {
  return (
    <form action={archiveOpportunityAction}>
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <Button type="submit" variant="outline" size="sm">
        В архив
      </Button>
    </form>
  );
}
