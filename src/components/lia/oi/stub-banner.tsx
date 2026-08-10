import { LIA_OI_STUB_BANNER } from "@/config/lia-oi";

export function LiaOiStubBanner() {
  return (
    <div
      role="status"
      className="rounded-sm border border-accent/40 bg-accent-muted px-4 py-3 text-sm text-foreground"
    >
      <p className="font-medium text-accent">Demo / Stub</p>
      <p className="mt-1 text-muted">{LIA_OI_STUB_BANNER}</p>
    </div>
  );
}
