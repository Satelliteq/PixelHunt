import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="bg-primary py-4">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-2xl font-bold text-white">
            BilBakalım
          </Link>
          <nav className="hidden space-x-4 md:flex">
            <Link to="/" className="text-white hover:text-gray-200">
              Ana Sayfa
            </Link>
            <Link to="/categories" className="text-white hover:text-gray-200">
              Kategoriler
            </Link>
            <Link to="/game" className="text-white hover:text-gray-200">
              Oyun
            </Link>
            <Link to="/leaderboard" className="text-white hover:text-gray-200">
              Liderler
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button asChild variant="outline" className="text-white border-white hover:text-white hover:bg-red-700">
            <Link to="/login">
              Giriş Yap
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}