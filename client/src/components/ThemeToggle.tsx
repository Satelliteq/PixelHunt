import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Apply theme when component mounts and when theme changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <IconButton
      variant="ghost"
      icon={theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      className="text-zinc-300 hover:text-white"
      aria-label="Tema Değiştir"
      onClick={toggleTheme}
    />
  );
}