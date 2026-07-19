import React from 'react';
import { motion } from 'motion/react';
import {
  Laptop,
  Code,
  Music,
  Palette,
  Trophy,
  Activity,
  GraduationCap,
  BookOpen,
  Lightbulb,
  Megaphone,
  Sparkles,
  Flame
} from 'lucide-react';

interface EventBackgroundProps {
  activeCategory?: string; // 'all' | 'Technical' | 'Cultural' | 'Sports' | 'Academic' | 'Workshop' | 'Seminar'
  theme?: string; // 'light' | 'dark' | 'neon' | 'forest' | 'sepia'
}

interface FloatingElement {
  id: number;
  icon: React.ComponentType<any>;
  category: string;
  colorClass: string;
  x: string; // horizontal percentage
  y: string; // vertical percentage
  size: number; // size in pixels
  delay: number; // animation delay
  duration: number; // animation duration
}

export default function EventBackground({ activeCategory = 'all', theme = 'light' }: EventBackgroundProps) {
  // Helper to get custom theme colored icons
  const getThemeColorClass = (baseCategory: string, defaultClass: string) => {
    if (theme === 'neon') {
      switch (baseCategory) {
        case 'Technical': return 'text-cyan-400/20';
        case 'Cultural': return 'text-pink-400/20';
        case 'Sports': return 'text-orange-400/20';
        case 'Academic': return 'text-fuchsia-400/20';
        default: return 'text-purple-400/20';
      }
    } else if (theme === 'forest') {
      return 'text-emerald-700/10 dark:text-emerald-600/15';
    } else if (theme === 'sepia') {
      return 'text-amber-800/10 dark:text-amber-700/15';
    }
    return defaultClass;
  };

  // Elements distributed across the screen
  const elements: FloatingElement[] = [
    // Technical
    { id: 1, icon: Laptop, category: 'Technical', colorClass: getThemeColorClass('Technical', 'text-blue-500/10 dark:text-blue-400/8'), x: '10%', y: '15%', size: 48, delay: 0, duration: 25 },
    { id: 2, icon: Code, category: 'Technical', colorClass: getThemeColorClass('Technical', 'text-indigo-500/10 dark:text-indigo-400/8'), x: '85%', y: '25%', size: 36, delay: 3, duration: 20 },
    
    // Cultural
    { id: 3, icon: Music, category: 'Cultural', colorClass: getThemeColorClass('Cultural', 'text-pink-500/10 dark:text-pink-400/8'), x: '75%', y: '12%', size: 40, delay: 1, duration: 22 },
    { id: 4, icon: Palette, category: 'Cultural', colorClass: getThemeColorClass('Cultural', 'text-rose-500/10 dark:text-rose-400/8'), x: '15%', y: '75%', size: 44, delay: 5, duration: 28 },
    
    // Sports
    { id: 5, icon: Trophy, category: 'Sports', colorClass: getThemeColorClass('Sports', 'text-amber-500/10 dark:text-amber-400/8'), x: '90%', y: '65%', size: 52, delay: 2, duration: 30 },
    { id: 6, icon: Activity, category: 'Sports', colorClass: getThemeColorClass('Sports', 'text-emerald-500/10 dark:text-emerald-400/8'), x: '40%', y: '85%', size: 32, delay: 4, duration: 18 },
    { id: 7, icon: Flame, category: 'Sports', colorClass: getThemeColorClass('Sports', 'text-orange-500/10 dark:text-orange-400/8'), x: '5%', y: '45%', size: 38, delay: 6, duration: 24 },

    // Academic
    { id: 8, icon: GraduationCap, category: 'Academic', colorClass: getThemeColorClass('Academic', 'text-violet-500/10 dark:text-violet-400/8'), x: '30%', y: '20%', size: 56, delay: 1.5, duration: 32 },
    { id: 9, icon: BookOpen, category: 'Academic', colorClass: getThemeColorClass('Academic', 'text-purple-500/10 dark:text-purple-400/8'), x: '60%', y: '78%', size: 38, delay: 4.5, duration: 26 },

    // Workshops / Seminars
    { id: 10, icon: Lightbulb, category: 'Workshop', colorClass: getThemeColorClass('Workshop', 'text-yellow-500/10 dark:text-yellow-400/8'), x: '70%', y: '45%', size: 42, delay: 2.5, duration: 21 },
    { id: 11, icon: Megaphone, category: 'Seminar', colorClass: getThemeColorClass('Seminar', 'text-sky-500/10 dark:text-sky-400/8'), x: '50%', y: '5%', size: 34, delay: 5.5, duration: 23 },
    { id: 12, icon: Sparkles, category: 'all', colorClass: getThemeColorClass('all', 'text-amber-400/15 dark:text-amber-300/10'), x: '25%', y: '55%', size: 30, delay: 0.5, duration: 15 }
  ];

  // Helper to check if element matches the active filter category
  const isHighlighted = (itemCategory: string) => {
    if (activeCategory === 'all') return true;
    return itemCategory.toLowerCase() === activeCategory.toLowerCase();
  };

  // Dynamic glow backgrounds based on category filter & theme
  const getGlowColors = () => {
    if (theme === 'neon') {
      return {
        blob1: 'bg-fuchsia-500/15',
        blob2: 'bg-cyan-500/15',
        blob3: 'bg-indigo-500/10'
      };
    } else if (theme === 'forest') {
      return {
        blob1: 'bg-emerald-600/12',
        blob2: 'bg-amber-600/10',
        blob3: 'bg-green-700/8'
      };
    } else if (theme === 'sepia') {
      return {
        blob1: 'bg-amber-600/10',
        blob2: 'bg-orange-700/8',
        blob3: 'bg-yellow-700/8'
      };
    }

    switch (activeCategory.toLowerCase()) {
      case 'technical':
        return {
          blob1: 'bg-blue-500/5 dark:bg-blue-500/10',
          blob2: 'bg-indigo-500/5 dark:bg-indigo-500/10',
        };
      case 'cultural':
        return {
          blob1: 'bg-pink-500/5 dark:bg-pink-500/10',
          blob2: 'bg-rose-500/5 dark:bg-rose-500/10',
        };
      case 'sports':
        return {
          blob1: 'bg-emerald-500/5 dark:bg-emerald-500/10',
          blob2: 'bg-orange-500/5 dark:bg-orange-500/10',
        };
      case 'academic':
        return {
          blob1: 'bg-violet-500/5 dark:bg-violet-500/10',
          blob2: 'bg-fuchsia-500/5 dark:bg-fuchsia-500/10',
        };
      case 'workshop':
        return {
          blob1: 'bg-amber-500/5 dark:bg-amber-500/10',
          blob2: 'bg-yellow-500/5 dark:bg-yellow-500/10',
        };
      case 'seminar':
        return {
          blob1: 'bg-sky-500/5 dark:bg-sky-500/10',
          blob2: 'bg-teal-500/5 dark:bg-teal-500/10',
        };
      default: // all
        return {
          blob1: 'bg-blue-500/4 dark:bg-blue-500/6',
          blob2: 'bg-violet-500/4 dark:bg-violet-500/6',
          blob3: 'bg-pink-500/3 dark:bg-pink-500/5',
        };
    }
  };

  const glows = getGlowColors();

  // Determine dot grid gradient colors
  const getDotGridStyle = () => {
    switch (theme) {
      case 'neon':
        return 'radial-gradient(#271252 1.5px, transparent 1.5px)';
      case 'forest':
        return 'radial-gradient(#cbd5c8 1.5px, transparent 1.5px)';
      case 'sepia':
        return 'radial-gradient(#e4d7bf 1.5px, transparent 1.5px)';
      case 'dark':
        return 'radial-gradient(#334155 1.5px, transparent 1.5px)';
      default:
        return 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)';
    }
  };

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      {/* 1. Subtle Dot Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.25]"
        style={{
          backgroundImage: getDotGridStyle(),
          backgroundSize: '24px 24px'
        }}
      />

      {/* 2. Soft Dynamic Glowing Blobs */}
      <div className="absolute inset-0 flex items-center justify-center filter blur-[100px] sm:blur-[130px]">
        {/* Blob 1 */}
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 50, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full top-10 left-10 transition-all duration-700 ${glows.blob1}`}
        />

        {/* Blob 2 */}
        <motion.div
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 40, -40, 0],
            scale: [1, 0.85, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute w-[350px] h-[350px] sm:w-[550px] sm:h-[550px] rounded-full bottom-10 right-10 transition-all duration-700 ${glows.blob2}`}
        />

        {/* Optional Blob 3 */}
        {'blob3' in glows && (
          <motion.div
            animate={{
              x: [0, 20, -30, 0],
              y: [0, 40, 20, 0],
              scale: [1, 1.2, 0.8, 1],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`absolute w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] rounded-full top-[40%] left-[35%] transition-all duration-700 ${(glows as any).blob3}`}
          />
        )}
      </div>

      {/* 3. Floating Event Icons */}
      <div className="absolute inset-0">
        {elements.map((item) => {
          const Icon = item.icon;
          const highlighted = isHighlighted(item.category);
          
          return (
            <motion.div
              key={item.id}
              style={{
                position: 'absolute',
                left: item.x,
                top: item.y,
              }}
              animate={{
                y: [0, -15, 15, 0],
                rotate: [0, 10, -10, 0],
                scale: highlighted ? [1, 1.05, 1] : [0.75, 0.75, 0.75],
              }}
              transition={{
                duration: item.duration,
                delay: item.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`transition-all duration-500 ${
                highlighted 
                  ? `${item.colorClass} opacity-100 scale-100` 
                  : 'text-slate-300/[0.02] dark:text-slate-800/[0.01] opacity-20 scale-75'
              }`}
            >
              <Icon 
                size={item.size} 
                strokeWidth={1.25} 
                className="transform transition-transform hover:scale-110 duration-300"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
