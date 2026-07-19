import React, { useState } from 'react';
import { Announcement } from '../types';
import { Megaphone, Search, Filter, AlertCircle, Bookmark, Star, Calendar, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnnouncementsListProps {
  announcements: Announcement[];
  isAdmin: boolean;
  onDeleteAnnouncement?: (id: string) => void;
}

export default function AnnouncementsList({ announcements, isAdmin, onDeleteAnnouncement }: AnnouncementsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesSearch = ann.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ann.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ann.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'important':
        return 'border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400';
      case 'academic':
        return 'border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400';
      case 'sports':
        return 'border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400';
      case 'culture':
        return 'border-l-pink-500 bg-pink-50/20 dark:bg-pink-950/10 text-pink-700 dark:text-pink-400';
      default:
        return 'border-l-blue-500 bg-blue-50/20 dark:bg-blue-950/10 text-blue-700 dark:text-blue-400';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            id="ann-search-input"
            type="text"
            placeholder="Search campus notices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          <select
            id="ann-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white"
          >
            <option value="all">All Notice Types</option>
            <option value="important">🚨 Important Notices</option>
            <option value="academic">📚 Academic Notices</option>
            <option value="sports">🏀 Sports Board</option>
            <option value="culture">🎭 Cultural Society</option>
            <option value="general">📢 General News</option>
          </select>
        </div>
      </div>

      {/* Announcements Stream */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredAnnouncements.map((ann) => (
            <motion.div
              layout
              key={ann.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 rounded-r-2xl shadow-xs relative flex flex-col justify-between ${getCategoryColor(
                ann.category
              )}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {ann.category === 'important' ? (
                      <AlertCircle className="h-4 w-4 text-rose-500 animate-pulse" />
                    ) : (
                      <Bookmark className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-80">
                      {ann.category} notice
                    </span>
                  </div>

                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(ann.date)}</span>
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-950 dark:text-white">{ann.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {ann.content}
                </p>
              </div>

              {/* Author Footer */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Posted by <span className="font-semibold">{ann.postedBy}</span>
                </div>

                {isAdmin && onDeleteAnnouncement && (
                  <button
                    id={`btn-delete-ann-${ann.id}`}
                    onClick={() => onDeleteAnnouncement(ann.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                    title="Delete Announcement"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAnnouncements.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Megaphone className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No announcements match search criteria</p>
            <p className="text-[10px] text-slate-400 mt-1">Try resetting the filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
