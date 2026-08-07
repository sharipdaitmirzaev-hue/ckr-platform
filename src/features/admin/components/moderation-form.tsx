import { Button } from "@/components/ui/button";
import { verificationStatusLabels } from "@/config/verification";

type Option = {
  value: string;
  label: string;
};

type ModerationFormProps = {
  action: (formData: FormData) => Promise<void>;
  id: string;
  status: string;
  verificationStatus: string;
  statusOptions: Option[];
};

export function ModerationForm({
  action,
  id,
  status,
  verificationStatus,
  statusOptions,
}: ModerationFormProps) {
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="space-y-1 text-xs text-muted">
        Статус
        <select
          name="status"
          defaultValue={status}
          className="flex h-9 min-w-[140px] rounded-sm border border-border bg-background px-2 text-sm text-foreground"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs text-muted">
        Проверка
        <select
          name="verificationStatus"
          defaultValue={verificationStatus}
          className="flex h-9 min-w-[140px] rounded-sm border border-border bg-background px-2 text-sm text-foreground"
        >
          {Object.entries(verificationStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" size="sm" variant="outline">
        Сохранить
      </Button>
    </form>
  );
}
