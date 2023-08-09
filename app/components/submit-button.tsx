import { Button, type ButtonProps } from "~/components/ui/button.tsx";

export function SubmitButton({
  disabled,
  state = "idle",
  ...props
}: ButtonProps & {
  state?: "idle" | "loading" | "submitting";
}) {
  return <Button {...props} disabled={disabled || state !== "idle"} />;
}
