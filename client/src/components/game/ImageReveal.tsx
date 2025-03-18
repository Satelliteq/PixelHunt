import React, { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { generateRevealGrid, playSoundEffect } from "@/lib/gameHelpers";

type ImageRevealProps = {
  imageUrl: string;
  revealPercent: number;
  gridSize?: number;
  className?: string;
  onCellReveal?: () => void;
  revealSpecificCell?: number; // Kullanıcının açabileceği belirli hücre
  staticReveal?: boolean; // Statik mod veya rastgele açılım (true = statik, false = rastgele)
};

export default function ImageReveal({
  imageUrl,
  revealPercent,
  gridSize = 4, // 4x4 grid yapısına güncellendi
  className,
  onCellReveal,
  revealSpecificCell,
  staticReveal = false
}: ImageRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [revealedCells, setRevealedCells] = useState<number[]>([]);
  const [lastUpdatedPercent, setLastUpdatedPercent] = useState(0);
  
  // Load image and get dimensions
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setDimensions({
        width: img.width,
        height: img.height
      });
      setImageLoaded(true);
      // Yeni görsel yüklendiğinde reveal yüzdesini sıfırla
      setRevealedCells([]);
      setLastUpdatedPercent(0);
    };
  }, [imageUrl]);
  
  // Update revealed cells when revealPercent changes
  useEffect(() => {
    if (!imageLoaded) return;
    
    // Eğer spesifik bir hücre açılması isteniyorsa
    if (revealSpecificCell !== undefined) {
      if (!revealedCells.includes(revealSpecificCell)) {
        setRevealedCells(prev => [...prev, revealSpecificCell]);
        playSoundEffect('reveal', 0.3);
        if (onCellReveal) onCellReveal();
      }
      return;
    }
    
    // Yüzde değiştiğinde ek hücreleri açığa çıkar
    if (revealPercent > lastUpdatedPercent) {
      const totalCells = gridSize * gridSize;
      const cellsToReveal = Math.floor(totalCells * (revealPercent / 100));
      const remainingCellCount = cellsToReveal - revealedCells.length;
      
      if (remainingCellCount > 0) {
        // Tüm hücreler
        const allCells = Array.from({ length: totalCells }, (_, i) => i);
        // Henüz açılmamış hücreler
        const unrevealedCells = allCells.filter(cell => !revealedCells.includes(cell));
        
        // Açılacak yeni hücreleri seç (rastgele veya statik mod)
        let newCellsToReveal: number[] = [];
        
        if (staticReveal) {
          // Statik mod - sırasıyla açılır
          newCellsToReveal = unrevealedCells.slice(0, remainingCellCount);
        } else {
          // Rastgele mod - karıştırılmış sırada açılır
          for (let i = 0; i < remainingCellCount && i < unrevealedCells.length; i++) {
            const randomIndex = Math.floor(Math.random() * unrevealedCells.length);
            newCellsToReveal.push(unrevealedCells[randomIndex]);
            unrevealedCells.splice(randomIndex, 1);
          }
        }
        
        if (newCellsToReveal.length > 0) {
          playSoundEffect('reveal', 0.3);
          setRevealedCells(prev => [...prev, ...newCellsToReveal]);
          if (onCellReveal) onCellReveal();
        }
      }
      
      setLastUpdatedPercent(revealPercent);
    }
  }, [imageLoaded, revealPercent, gridSize, revealedCells, lastUpdatedPercent, onCellReveal, revealSpecificCell, staticReveal]);

  // Draw the image with the revealed cells
  const drawImage = useCallback(() => {
    if (!imageLoaded || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const img = new Image();
    img.src = imageUrl;
    
    img.onload = () => {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the full image first
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Grid parametreleri
      const cellWidth = canvas.width / gridSize;
      const cellHeight = canvas.height / gridSize;
      const totalCells = gridSize * gridSize;
      
      // Açılmamış hücreleri siyah ile kapat
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      
      for (let i = 0; i < totalCells; i++) {
        if (!revealedCells.includes(i)) {
          const x = (i % gridSize) * cellWidth;
          const y = Math.floor(i / gridSize) * cellHeight;
          ctx.fillRect(x, y, cellWidth, cellHeight);
        }
      }
      
      // Grid çizgilerini çiz
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      
      // Yatay çizgiler
      for (let i = 1; i < gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellHeight);
        ctx.lineTo(canvas.width, i * cellHeight);
        ctx.stroke();
      }
      
      // Dikey çizgiler
      for (let i = 1; i < gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellWidth, 0);
        ctx.lineTo(i * cellWidth, canvas.height);
        ctx.stroke();
      }
    };
  }, [imageLoaded, imageUrl, dimensions, gridSize, revealedCells]);
  
  // Re-draw when revealed cells change
  useEffect(() => {
    drawImage();
  }, [drawImage, revealedCells]);
  
  // Canvas tıklama olayı - kullanıcı hücre açabilir
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageLoaded || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Tıklama koordinatlarını hesapla
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Tıklanan hücreyi bul
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;
    
    const cellX = Math.floor(x / (rect.width / gridSize));
    const cellY = Math.floor(y / (rect.height / gridSize));
    
    const cellIndex = cellY * gridSize + cellX;
    
    // Eğer bu hücre zaten açıkta değilse açığa çıkar
    if (!revealedCells.includes(cellIndex)) {
      playSoundEffect('reveal', 0.3);
      setRevealedCells(prev => [...prev, cellIndex]);
      
      // Açılan hücre oranını güncelle (opsiyonel)
      const newRevealPercent = Math.ceil((revealedCells.length + 1) / (gridSize * gridSize) * 100);
      if (newRevealPercent > lastUpdatedPercent) {
        setLastUpdatedPercent(newRevealPercent);
      }
      
      if (onCellReveal) onCellReveal();
    }
  };

  if (!imageLoaded) {
    return (
      <div className={cn("animate-pulse bg-zinc-800 rounded-lg", className)}>
        <div className="flex items-center justify-center h-full">
          <span className="text-zinc-500">Resim yükleniyor...</span>
        </div>
      </div>
    );
  }

  // Yüzde hesaplaması
  const actualRevealPercent = Math.ceil((revealedCells.length / (gridSize * gridSize)) * 100);

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full object-contain cursor-pointer"
        style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
        onClick={handleCanvasClick}
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
        {actualRevealPercent}% görünür
      </div>
    </div>
  );
}
