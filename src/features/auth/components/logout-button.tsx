import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
};

export function LogoutButton({
  className,
  variant = "outline",
}: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant={variant} size="sm" className={className}>
        Выйти
      </Button>
    </form>
  );
}
