import React from "react";
import { Play } from "lucide-react";

type ContentCardProps = {
  title: string;
  imageUrl?: string;
  playCount: number | null;
  likeCount: number | null;
  duration: string;
  onClick: () => void;
};

export default function ContentCard({
  title,
  imageUrl = "https://via.placeholder.com/600x400",
  playCount,
  likeCount,
  duration,
  onClick
}: ContentCardProps) {
  return (
    <div 
      className="bg-zinc-900 rounded-xl overflow-hidden transition-transform duration-200 hover:scale-103 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <img 
          src={imageUrl} 
          className="w-full h-40 object-cover" 
          alt={title}
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <button 
            className="bg-white bg-opacity-20 hover:bg-opacity-30 w-12 h-12 rounded-full flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Play className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
          {duration}
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-2">{title}</p>
        <div className="flex items-center mt-2">
          <span className="text-xs text-zinc-400">{playCount || 0} Oynama</span>
          <span className="mx-2 text-zinc-500">•</span>
          <span className="text-xs text-zinc-400">{likeCount || 0} Beğeni</span>
        </div>
      </div>
    </div>
  );
}
