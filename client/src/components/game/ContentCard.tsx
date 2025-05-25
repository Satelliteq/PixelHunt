import React from "react";
import { Play, Users, Heart, Clock, Calendar, BookOpen } from "lucide-react";

type ContentCardProps = {
  title: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  playCount: number | null;
  likeCount: number | null;
  duration?: string;
  onClick: () => void;
};

export const ContentCard = ({
  title,
  description,
  imageUrl = "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500",
  category,
  playCount,
  likeCount,
  duration = "5 dk",
  onClick
}: ContentCardProps) => {
  return (
    <div 
      className="test-card rounded-xl overflow-hidden transition-all duration-200 hover:translate-y-[-5px] cursor-pointer group border border-border/30 bg-card shadow-sm"
      onClick={onClick}
    >
      <div className="relative aspect-video">
        <img 
          src={imageUrl.startsWith('/attached_assets/') 
            ? `https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500` // Default fallback image
            : imageUrl} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          alt={title}
          onError={(e) => {
            // If image fails to load, replace with a default image
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500";
          }}
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
        {duration && (
          <div className="absolute bottom-2 left-2 bg-primary/90 text-white text-xs px-2 py-1 rounded-full">
            {duration}
          </div>
        )}
        {category && (
          <div className="absolute top-2 left-2 bg-background/90 text-foreground text-xs px-2 py-1 rounded-full">
            {category}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
        )}
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
};