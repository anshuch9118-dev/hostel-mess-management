import React, { useState } from 'react';
import { MealType } from '../types';
import { Star, X, MessageSquare, ThumbsUp, Send, CheckCircle2 } from 'lucide-react';

interface MealRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  date: string;
  existingRating?: number;
  existingFeedback?: string;
  onSubmit: (mealType: MealType, rating: number, feedback: string) => Promise<void>;
}

const mealTypeTitles: Record<MealType, { title: string; emoji: string }> = {
  breakfast: { title: 'Morning Breakfast', emoji: '🌅' },
  lunch: { title: 'Afternoon Lunch', emoji: '🍛' },
  snacks: { title: 'Evening Snacks', emoji: '☕' },
  dinner: { title: 'Night Dinner', emoji: '🌙' },
};

const quickTags = [
  'Delicious & Fresh',
  'Good Variety',
  'Perfect Hygiene',
  'Needs More Salt',
  'Less Spicy Please',
  'Portion Size Small',
  'Top Quality',
];

export const MealRatingModal: React.FC<MealRatingModalProps> = ({
  isOpen,
  onClose,
  mealType,
  date,
  existingRating = 0,
  existingFeedback = '',
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(existingRating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>(existingFeedback || '');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleTagClick = (tag: string) => {
    if (feedback.includes(tag)) {
      setFeedback(feedback.replace(tag, '').trim());
    } else {
      setFeedback(feedback ? `${feedback} • ${tag}` : tag);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(mealType, rating, feedback);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const info = mealTypeTitles[mealType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-100">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <span className="text-3xl mb-1 block">{info.emoji}</span>
          <h3 className="text-lg font-bold text-white">
            Rate {info.title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Date: <span className="text-amber-400 font-medium">{date}</span> • Rate 1-5 stars once per meal
          </p>
        </div>

        {successMsg ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">Rating Submitted!</h4>
            <p className="text-xs text-slate-400">Thank you for helping us improve hostel food quality.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Interactive 1-5 Star Selection */}
            <div className="text-center bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-semibold text-amber-400">
                {rating === 5 && '🌟 Excellent Food Quality'}
                {rating === 4 && '😊 Very Good & Satisfying'}
                {rating === 3 && '😐 Average / Room for Improvement'}
                {rating === 2 && '👎 Below Expectation'}
                {rating === 1 && '⚠️ Poor / Needs Immediate Attention'}
              </p>
            </div>

            {/* Quick Feedback Tags */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center space-x-1">
                <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Tags</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickTags.map((tag) => {
                  const isSelected = feedback.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment Text Area */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Detailed Suggestions / Comments (Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Share your feedback about taste, hygiene, quantity, or suggestions..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 font-bold text-slate-950 text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Food Rating'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
