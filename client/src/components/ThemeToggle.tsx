
import { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "lucide-react";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Sayfa yüklendiğinde mevcut temayı belirle
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" || "dark";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const applyTheme = (selectedTheme: "light" | "dark") => {
    // HTML veya body'ye karanlık/aydınlık mod sınıfı ekle
    document.documentElement.classList.toggle("dark", selectedTheme === "dark");
    
    // Arka plan renklerini değiştir
    if (selectedTheme === "dark") {
      document.body.style.backgroundColor = "black";
      document.body.style.color = "white";
    } else {
      document.body.style.backgroundColor = "white";
      document.body.style.color = "black";
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
      {theme === "light" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </Button>
  );
}
