import React from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/icons/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/icon-button";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  Grid2X2,
  Zap,
  List,
  Search,
  Gamepad,
  User
} from "lucide-react";

export default function Header() {
  const [_location, navigate] = useLocation();

  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
            <span className="font-bold text-xl">Pixelhunt</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-4">
            <IconButton
              variant="ghost"
              icon={<Grid2X2 className="w-4 h-4" />}
              label="Kategoriler"
              className="text-muted-foreground hover:text-foreground text-sm"
              onClick={() => {}}
            />
            
            <IconButton
              variant="ghost"
              icon={<Zap className="w-4 h-4" />}
              label="Trendler"
              className="text-muted-foreground hover:text-foreground text-sm"
              onClick={() => {}}
            />
            
            <IconButton
              variant="ghost"
              icon={<List className="w-4 h-4" />}
              label="Lider Tablosu"
              className="text-muted-foreground hover:text-foreground text-sm"
              onClick={() => {}}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative hidden md:block w-64">
            <Input
              type="text"
              placeholder="Ara..."
              className="bg-muted w-full rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground h-8 w-8"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-full text-sm"
            onClick={() => navigate("/game/test")}
          >
            <Gamepad className="w-4 h-4 mr-1" /> Test Oyna
          </Button>
          
          <Button
            variant="outline"
            className="border-border px-4 py-2 rounded-full text-sm hover:bg-accent"
          >
            <User className="w-4 h-4 mr-1" /> Giriş Yap
          </Button>
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
