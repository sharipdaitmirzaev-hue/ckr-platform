import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  documentRelatedTypeLabels,
  documentStatusLabels,
  documentTypeLabels,
  documentVisibilityLabels,
} from "@/config/verification";
import { deleteDocumentAction } from "@/features/documents/actions";
import type { DocumentListItem } from "@/lib/documents/queries";

type DocumentListProps = {
  documents: DocumentListItem[];
  showRelated?: boolean;
  canDelete?: boolean;
  emptyText?: string;
};

export function DocumentList({
  documents,
  showRelated = true,
  canDelete = false,
  emptyText = "Документов пока нет.",
}: DocumentListProps) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }

  return (
    <ul className="space-y-3">
      {documents.map((document) => (
        <li key={document.id}>
          <Card variant="surface" className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-base text-foreground">
                  {document.name}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="accent">
                    {documentTypeLabels[document.documentType]}
                  </Badge>
                  <Badge variant="soft">
                    {documentVisibilityLabels[document.visibility]}
                  </Badge>
                  <Badge variant="default">
                    {documentStatusLabels[document.status]}
                  </Badge>
                  {showRelated ? (
                    <Badge variant="soft">
                      {documentRelatedTypeLabels[document.relatedType]}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {document.signedUrl ? (
                  <a
                    href={document.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-sm text-muted transition-colors hover:border-accent/40 hover:text-accent"
                  >
                    Открыть
                  </a>
                ) : null}
                {canDelete ? (
                  <form action={deleteDocumentAction}>
                    <input
                      type="hidden"
                      name="documentId"
                      value={document.id}
                    />
                    <Button type="submit" size="sm" variant="outline">
                      Удалить
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
