import { cn } from "@/lib/utils";

type ShieldMarkProps = {
  className?: string;
  title?: string;
};

/** Символ щита — знак надёжности ЦКР. */
export function ShieldMark({
  className,
  title = "ЦКР",
}: ShieldMarkProps) {
  return (
    <svg
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-accent", className)}
      role="img"
      aria-label={title}
    >
      <path
        d="M20 2.5L35 8.2V22.4C35 33.1 28.4 42.2 20 45.5C11.6 42.2 5 33.1 5 22.4V8.2L20 2.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 23.5L18.2 27.7L26.5 18.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
