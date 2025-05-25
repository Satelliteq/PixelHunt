import React from 'react';
import { Link } from 'react-router-dom';
import { TestData } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import { formatDate } from '../lib/utils';
import ContentCard from './ContentCard';

interface TestCardProps {
  test: TestData;
  onClick?: () => void;
}

export const TestCard: React.FC<TestCardProps> = ({ test, onClick }) => {
  const { t } = useLanguage();

  return (
    <ContentCard
      onClick={onClick}
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex flex-col h-full">
        <div className="relative aspect-video mb-4 rounded-lg overflow-hidden">
          <img
            src={test.thumbnailUrl || '/placeholder.png'}
            alt={test.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-2 text-white text-sm">
            {test.playCount} {t('plays')}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{test.title}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{test.description}</p>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{formatDate(test.createdAt)}</span>
            <span>{test.likeCount} {t('likes')}</span>
          </div>
        </div>
      </div>
    </ContentCard>
  );
}; 