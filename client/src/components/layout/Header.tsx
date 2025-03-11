import React from "react";
import { Link, useLocation } from "wouter";
import { Logo } from "@/components/icons/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconButton } from "@/components/ui/icon-button";
import { 
  Grid2X2,
  Zap,
  List,
  Search,
  Gamepad,
  User,
  Sun
} from "lucide-react";

export default function Header() {
  const [_location, navigate] = useLocation();

  return (
    <header className="border-b border-zinc-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
            <span className="text-white font-bold text-xl">Pixelhunt</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-4">
            <IconButton
              variant="ghost"
              icon={<Grid2X2 className="w-4 h-4" />}
              label="Kategoriler"
              className="text-zinc-300 hover:text-white text-sm"
              onClick={() => {}}
            />
            
            <IconButton
              variant="ghost"
              icon={<Zap className="w-4 h-4" />}
              label="Trendler"
              className="text-zinc-300 hover:text-white text-sm"
              onClick={() => {}}
            />
            
            <IconButton
              variant="ghost"
              icon={<List className="w-4 h-4" />}
              label="Lider Tablosu"
              className="text-zinc-300 hover:text-white text-sm"
              onClick={() => {}}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative hidden md:block w-64">
            <Input
              type="text"
              placeholder="Ara..."
              className="bg-zinc-800 w-full rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 h-8 w-8"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-full text-sm"
            onClick={() => navigate("/game/test")}
          >
            <Gamepad className="w-4 h-4 mr-1" /> Test Oyna
          </Button>
          
          <Button
            variant="outline"
            className="border-zinc-600 px-4 py-2 rounded-full text-sm hover:bg-zinc-800"
          >
            <User className="w-4 h-4 mr-1" /> Giriş Yap
          </Button>
          
          <IconButton
            variant="ghost"
            icon={<Sun className="w-4 h-4" />}
            className="text-zinc-300 hover:text-white"
            aria-label="Tema Değiştir"
          />
        </div>
      </div>
    </header>
  );
}
