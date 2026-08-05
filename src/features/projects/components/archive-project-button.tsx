import { archiveProjectAction } from "@/features/projects/actions";
import { Button } from "@/components/ui/button";

type ArchiveProjectButtonProps = {
  projectId: string;
};

export function ArchiveProjectButton({ projectId }: ArchiveProjectButtonProps) {
  return (
    <form action={archiveProjectAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <Button type="submit" variant="outline" size="sm">
        В архив
      </Button>
    </form>
  );
}
