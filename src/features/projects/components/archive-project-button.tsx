import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { archiveProjectAction } from "@/features/projects/actions";

type ArchiveProjectButtonProps = {
  projectId: string;
};

export function ArchiveProjectButton({ projectId }: ArchiveProjectButtonProps) {
  return (
    <form action={archiveProjectAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <ConfirmSubmitButton
        variant="outline"
        size="sm"
        confirmMessage="Отправить проект в архив? Он исчезнет из публичного каталога."
      >
        В архив
      </ConfirmSubmitButton>
    </form>
  );
}
