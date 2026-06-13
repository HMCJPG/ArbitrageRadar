import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/15 text-primary",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        velocity:
          "border-transparent bg-[hsl(var(--velocity)/0.15)] text-[hsl(var(--velocity))]",
        acceleration:
          "border-transparent bg-[hsl(var(--acceleration)/0.15)] text-[hsl(var(--acceleration))]",
        danger:
          "border-transparent bg-[hsl(var(--danger)/0.15)] text-[hsl(var(--danger))]",
        muted: "border-border bg-muted/60 text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
