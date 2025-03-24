import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { LogoWithText } from "@/components/icons/Logo";

export default function NotFound() {
  const [_, navigate] = useLocation();
  const { t } = useLanguage();
  
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center space-y-6 max-w-md">
        {/* Logo ve başlık */}
        <div className="mb-6">
          <LogoWithText className="h-10 mx-auto" />
        </div>
        
        <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="h-12 w-12 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="text-2xl font-semibold">Sayfa Bulunamadı</h2>
          <p className="text-muted-foreground">
            Aradığınız sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanılamıyor olabilir.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
          
          <Button
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Ana Sayfaya Git
          </Button>
        </div>
      </div>
    </div>
  );
}
