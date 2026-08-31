import { cn } from "@/utils";

export function PageWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto mb-12 w-full max-w-screen-2xl px-4 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:mb-4 xl:px-20 2xl:px-36",
        className,
      )}
      data-page-wrapper
    >
      {children}
    </div>
  );
}
