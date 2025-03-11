import React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

type GameModeCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  backgroundColor: string;
  to: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export default function GameModeCard({
  title,
  description,
  icon,
  backgroundColor,
  to,
  className,
  size = "lg"
}: GameModeCardProps) {
  const heights = {
    sm: "h-28",
    md: "h-40",
    lg: "h-60"
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  const descriptionSizes = {
    sm: "text-xs",
    md: "text-xs",
    lg: "text-sm"
  };

  return (
    <Link
      href={to}
      className={cn(
        "flex flex-col justify-between rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1 shadow-xl hover:shadow-2xl",
        heights[size],
        backgroundColor,
        className
      )}
    >
      <div>
        <h3 className={`font-bold mb-2 ${textSizes[size]}`}>{title}</h3>
        <p className={`opacity-90 ${descriptionSizes[size]}`}>{description}</p>
      </div>
      <div className="mt-4 flex justify-start">
        {icon}
      </div>
    </Link>
  );
}
