import { cn } from "@/utils";

export function MueIcon({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions = {
    sm: "size-4",
    md: "size-5",
    lg: "size-7",
  }[size];

  return (
    <svg
      aria-label="Mue, copilote IA"
      className={cn("shrink-0 text-current", dimensions, className)}
      fill="none"
      role="img"
      viewBox="0 0 24 24"
    >
      <path
        d="M11.2 2.8c.48 5.18 3.12 7.82 8.3 8.3-5.18.48-7.82 3.12-8.3 8.3-.48-5.18-3.12-7.82-8.3-8.3 5.18-.48 7.82-3.12 8.3-8.3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M19.2 2.7c.13 1.42.85 2.14 2.27 2.27-1.42.13-2.14.85-2.27 2.27-.13-1.42-.85-2.14-2.27-2.27 1.42-.13 2.14-.85 2.27-2.27Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}
