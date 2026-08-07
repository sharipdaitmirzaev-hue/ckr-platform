import { Button } from "@/components/ui/button";
import { closeInvestmentOfferAction } from "@/features/investments/actions";

type CloseInvestmentButtonProps = {
  offerId: string;
};

export function CloseInvestmentButton({ offerId }: CloseInvestmentButtonProps) {
  return (
    <form action={closeInvestmentOfferAction}>
      <input type="hidden" name="offerId" value={offerId} />
      <Button type="submit" variant="outline" size="sm">
        Закрыть
      </Button>
    </form>
  );
}
