import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { type VariantProps } from "class-variance-authority";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof Button> {
  icon: React.ReactNode;
  label?: string;
}

export function IconButton({
  className,
  variant = "ghost",
  size = "icon",
  icon,
  label,
  ...props
}: IconButtonProps) {
  const buttonContent = (
    <>
      {icon}
      {label && <span className="ml-2">{label}</span>}
    </>
  );

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      {buttonContent}
    </Button>
  );
}
