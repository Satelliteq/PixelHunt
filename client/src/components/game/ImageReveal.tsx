import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ImageRevealProps = {
  imageUrl: string;
  revealPercent: number;
  gridSize?: number;
  className?: string;
};

export default function ImageReveal({
  imageUrl,
  revealPercent,
  gridSize = 5,
  className
}: ImageRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
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
    };
  }, [imageUrl]);

  // Draw the image with the revealed portion
  useEffect(() => {
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
      
      // Create a grid and only reveal cells based on revealPercent
      const cellWidth = canvas.width / gridSize;
      const cellHeight = canvas.height / gridSize;
      const totalCells = gridSize * gridSize;
      const cellsToHide = Math.floor(totalCells * (1 - (revealPercent / 100)));
      
      // Create array of cell indices and shuffle it
      const cellIndices = Array.from({ length: totalCells }, (_, i) => i);
      for (let i = cellIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cellIndices[i], cellIndices[j]] = [cellIndices[j], cellIndices[i]];
      }
      
      // Hide cells that should not be revealed yet
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      
      for (let i = 0; i < cellsToHide; i++) {
        const cellIndex = cellIndices[i];
        const x = (cellIndex % gridSize) * cellWidth;
        const y = Math.floor(cellIndex / gridSize) * cellHeight;
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
    };
  }, [imageLoaded, revealPercent, gridSize, imageUrl, dimensions]);

  if (!imageLoaded) {
    return (
      <div className={cn("animate-pulse bg-zinc-800 rounded-lg", className)}>
        <div className="flex items-center justify-center h-full">
          <span className="text-zinc-500">Resim yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full object-contain"
        style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
        {revealPercent}% görünür
      </div>
    </div>
  );
}
