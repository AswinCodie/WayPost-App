import { Category } from '../types';

export interface CategoryInfo {
  name: Category;
  icon: string;
  color: string;
  bgLight: string;
  textColor: string;
  description: string;
}

export const CATEGORIES_CONFIG: Record<Category, CategoryInfo> = {
  Stories: {
    name: 'Stories',
    icon: '📖',
    color: '#3C6E71',
    bgLight: '#E8F1F2',
    textColor: '#1E3E41',
    description: 'Tales left behind by wanderers and passersby',
  },
  Kindness: {
    name: 'Kindness',
    icon: '💛',
    color: '#D4A373',
    bgLight: '#FAEDCD',
    textColor: '#70471A',
    description: 'Little warm gestures, shared umbrellas, and goodwill',
  },
  Travel: {
    name: 'Travel',
    icon: '🧭',
    color: '#18392D',
    bgLight: '#E4ECE7',
    textColor: '#18392D',
    description: 'Secret scenic viewpoints, trails, and quiet detours',
  },
  Food: {
    name: 'Food',
    icon: '☕',
    color: '#BC6C25',
    bgLight: '#F3E5D8',
    textColor: '#69360A',
    description: 'Street carts, bakeries, tea stalls, and hidden flavors',
  },
  Advice: {
    name: 'Advice',
    icon: '🍃',
    color: '#606C38',
    bgLight: '#EAEFD9',
    textColor: '#283618',
    description: 'Gentle wisdom and reflections for the road ahead',
  },
  'Odd Little Things': {
    name: 'Odd Little Things',
    icon: '✨',
    color: '#7B6D8D',
    bgLight: '#EFEBF4',
    textColor: '#3D3449',
    description: 'Curious oddities, brass dials, moss carvings, and quirks',
  },
};

export const ALL_CATEGORIES: Category[] = [
  'Stories',
  'Kindness',
  'Travel',
  'Food',
  'Advice',
  'Odd Little Things',
];

export function getCategoryInfo(category: Category): CategoryInfo {
  return (
    CATEGORIES_CONFIG[category] || {
      name: category,
      icon: '📍',
      color: '#18392D',
      bgLight: '#E4ECE7',
      textColor: '#18392D',
      description: 'A Waypost note',
    }
  );
}

export function formatTimeRemaining(expiresAt: string): { text: string; isUrgent: boolean } {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return { text: 'Expired', isUrgent: true };

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return { text: `${mins}m left`, isUrgent: true };
  }
  if (hours < 24) {
    return { text: `${hours}h left`, isUrgent: hours <= 6 };
  }
  const days = Math.floor(hours / 24);
  return { text: `${days}d left`, isUrgent: false };
}
