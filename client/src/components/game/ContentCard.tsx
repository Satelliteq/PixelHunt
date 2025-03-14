import React from "react";
import { Play, Users, Heart } from "lucide-react";

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
  imageUrl = "/default-test-thumb.jpg",
  playCount,
  likeCount,
  duration,
  onClick
}: ContentCardProps) {
  return (
    <div 
      className="test-card rounded-xl overflow-hidden transition-all duration-200 hover:translate-y-[-5px] cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-video">
        <img 
          src={imageUrl} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          alt={title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
          <button 
            className="bg-primary/90 hover:bg-primary w-10 h-10 rounded-full flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Play className="h-5 w-5 text-primary-foreground" />
          </button>
        </div>
        <div className="absolute bottom-2 left-2 bg-primary/90 text-white text-xs px-2 py-1 rounded-full">
          {duration}
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{title}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5 mr-1" />
              <span>{playCount || 0}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Heart className="w-3.5 h-3.5 mr-1" />
              <span>{likeCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
