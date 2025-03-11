import React from "react";
import { Logo } from "@/components/icons/Logo";
import { IconButton } from "@/components/ui/icon-button";
import { Globe, HelpCircle, Send, Bell } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-900 py-6 border-t border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Logo className="w-6 h-6" />
            <span className="text-white font-bold text-xl ml-2">Pixelhunt</span>
          </div>
          
          <div className="flex flex-wrap space-x-4 mb-4 md:mb-0">
            <button className="text-zinc-400 hover:text-white flex items-center">
              <Globe className="w-4 h-4 mr-2" /> Türkçe
            </button>
            <button className="text-zinc-400 hover:text-white">
              Kullanım Koşulları
            </button>
            <button className="text-zinc-400 hover:text-white">
              Gizlilik Sözleşmesi
            </button>
            <button className="text-zinc-400 hover:text-white">
              Duyurular
            </button>
          </div>
          
          <div className="flex space-x-3">
            <IconButton
              variant="outline"
              icon={<HelpCircle className="w-4 h-4" />}
              className="w-8 h-8 rounded-full bg-zinc-800 border-zinc-700"
              aria-label="Yardım"
            />
            <IconButton
              variant="outline"
              icon={<Send className="w-4 h-4" />}
              className="w-8 h-8 rounded-full bg-zinc-800 border-zinc-700"
              aria-label="İletişim"
            />
            <IconButton
              variant="outline"
              icon={<Bell className="w-4 h-4" />}
              className="w-8 h-8 rounded-full bg-zinc-800 border-zinc-700"
              aria-label="Bildirimler"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
