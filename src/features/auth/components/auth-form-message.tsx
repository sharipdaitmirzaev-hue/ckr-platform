type AuthFormMessageProps = {
  error?: string;
  success?: string;
};

export function AuthFormMessage({ error, success }: AuthFormMessageProps) {
  if (!error && !success) return null;

  return (
    <div
      role="alert"
      className={
        error
          ? "rounded-sm border border-danger/40 bg-danger-muted px-3 py-2 text-sm text-danger"
          : "rounded-sm border border-accent/30 bg-accent-muted px-3 py-2 text-sm text-accent"
      }
    >
      {error ?? success}
    </div>
  );
}
