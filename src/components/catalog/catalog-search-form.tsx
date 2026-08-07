import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  action: string;
  defaultValue?: string;
  placeholder?: string;
  /** Скрытые поля для сохранения фильтров. */
  hidden?: Record<string, string | null | undefined>;
};

export function CatalogSearchForm({
  action,
  defaultValue = "",
  placeholder = "Поиск…",
  hidden = {},
}: Props) {
  return (
    <form action={action} method="get" className="flex flex-col gap-3 sm:flex-row">
      {Object.entries(hidden).map(([key, value]) =>
        value ? (
          <input key={key} type="hidden" name={key} value={value} />
        ) : null,
      )}
      <Input
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="sm:max-w-md"
      />
      <Button type="submit" variant="outline">
        Найти
      </Button>
    </form>
  );
}
