import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bug, 
  Lightbulb, 
  MessageCircle, 
  HelpCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { apiFetch } from '../utils/api';

enum FeedbackCategory {
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  GENERAL = 'general',
  UX = 'ux',
  OTHER = 'other',
}

export const Feedback: React.FC = () => {
  const [category, setCategory] = useState<FeedbackCategory>(FeedbackCategory.GENERAL);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await apiFetch('/api/users/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, message }),
      });

      if (response.ok) {
        setStatus({ 
          type: 'success', 
          message: 'Thank you for your feedback! We appreciate your input and will review it soon.' 
        });
        setSubject('');
        setMessage('');
        setCategory(FeedbackCategory.GENERAL);
      } else {
        const data = await response.json();
        setStatus({ type: 'error', message: data.error || 'Failed to submit feedback.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'An error occurred. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: FeedbackCategory.GENERAL, label: 'General Feedback', icon: MessageCircle, description: 'Share your overall thoughts or reviews.' },
    { id: FeedbackCategory.BUG, label: 'Report a Bug', icon: Bug, description: 'Found something broken? Let us know.' },
    { id: FeedbackCategory.FEATURE_REQUEST, label: 'Feature Request', icon: Lightbulb, description: 'Suggest a new idea or improvement.' },
    { id: FeedbackCategory.UX, label: 'UI/UX Feedback', icon: MessageSquare, description: 'Feedback on the look and feel.' },
    { id: FeedbackCategory.OTHER, label: 'Other', icon: HelpCircle, description: 'Anything else on your mind.' },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Send Feedback</h1>
        <p className="text-text-muted text-lg">
          We're constantly working to improve Tahfiz Academy. Your reviews and suggestions help us build a better experience for everyone.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-surface-dark border border-border-green/20 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lightbulb size={20} className="text-primary" />
              Why Feedback?
            </h2>
            <ul className="flex flex-col gap-3 text-sm text-text-muted">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                Help us squash annoying bugs.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                Request features that make your life easier.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                Let us know what you love about the app.
              </li>
            </ul>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <p className="text-sm text-primary leading-relaxed italic">
              "Your feedback is the compass that guides our development. We read every single message."
            </p>
          </div>
        </div>

        {/* Form Area */}
        <div className="lg:col-span-2">
          <div className="bg-surface-dark border border-border-green/30 rounded-2xl overflow-hidden shadow-xl">
            <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-8">
              
              {/* Category Selection */}
              <div className="flex flex-col gap-4">
                <label className="text-sm font-bold text-white tracking-wide uppercase">Select Category</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`
                        flex flex-col items-start gap-1 p-4 rounded-xl border transition-all text-left
                        ${category === cat.id 
                          ? 'bg-primary/10 border-primary text-primary' 
                          : 'bg-background-dark/30 border-border-green/10 text-text-muted hover:border-border-green/30'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <cat.icon size={18} />
                        {cat.label}
                      </div>
                      <span className="text-xs opacity-70 leading-tight">{cat.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white tracking-wide uppercase">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Navigation issue, New reporting idea..."
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  required
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white tracking-wide uppercase">Your Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your feedback in detail. If it's a bug, try to include steps to reproduce it..."
                  className="w-full bg-background-dark/50 border border-border-green/30 rounded-xl p-4 text-white placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors min-h-[160px] resize-none"
                  required
                ></textarea>
              </div>

              {status && (
                <div className={`
                  p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300
                  ${status.type === 'success' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-red-500/10 border-red-500/30 text-red-400'}
                `}>
                  {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <Bug size={20} className="shrink-0" />}
                  <span className="text-sm font-medium">{status.message}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group w-full py-4 bg-primary hover:bg-primary-hover text-background-dark font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    Send Feedback
                    <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
