import Link from "next/link";
import { CRM_TABS, crmTabLabels, type CrmTab } from "@/config/crm";
import { cn } from "@/lib/utils";

type CrmTabsProps = {
  active: CrmTab;
};

export function CrmTabs({ active }: CrmTabsProps) {
  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-border pb-3"
      aria-label="Разделы CRM"
    >
      {CRM_TABS.map((tab) => {
        const href = tab === "contacts" ? "/admin/crm" : `/admin/crm?tab=${tab}`;
        const isActive = active === tab;
        return (
          <Link
            key={tab}
            href={href}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-accent-muted text-accent"
                : "text-muted hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            {crmTabLabels[tab]}
          </Link>
        );
      })}
    </nav>
  );
}
