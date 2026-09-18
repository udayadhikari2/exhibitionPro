'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Star,
  Users,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Award,
} from 'lucide-react';
import { ITeam, IVisitorFeedback } from '@/lib/types';

export default function StallLandingPage() {
  const params = useParams();
  const code = params.code as string;

  const [team, setTeam] = useState<ITeam | null>(null);
  const [feedbackList, setFeedbackList] = useState<IVisitorFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [visitorName, setVisitorName] = useState('');
  const [visitorType, setVisitorType] = useState('General Visitor');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchStallData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${code}`);
      const data = await res.json();
      if (data.team) {
        setTeam(data.team);
        // Fetch feedback
        const fbRes = await fetch(`/api/feedback?teamId=${data.team._id}`);
        const fbData = await fbRes.json();
        setFeedbackList(fbData.feedback || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStallData();
  }, [code]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !visitorName || !comments) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: team._id,
          visitorName,
          visitorType,
          rating,
          comments,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setComments('');
        fetchStallData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading stall exhibit details...
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-900">Stall Not Found</h2>
        <p className="text-xs text-slate-500">
          No active project matches code <span className="font-mono font-bold">{code}</span>.
        </p>
        <Link
          href="/"
          className="inline-block text-xs font-bold text-blue-600 hover:underline pt-2"
        >
          Return to Portal Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Stall Identification Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono font-bold text-sm shadow-xs">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>{team.tableNumber || 'Exhibition Stall'}</span>
          </div>

          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            CODE: {team.teamCode}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
          {team.title}
        </h1>

        <div className="text-xs text-slate-600 leading-relaxed space-y-2">
          <p>{team.abstract}</p>
        </div>

        <div className="pt-1">
          <Link
            href={`/events/${(team as any).eventSlug || team.eventId || 'science-innovation-2026'}/projects/${team.teamCode}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
          >
            <span>Open Digital Project Showcase &amp; Media Gallery</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {team.techStack && (
          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
            <span className="font-bold text-slate-800">Key Technology / Materials: </span>
            {team.techStack}
          </div>
        )}

        {/* Team Members */}
        {team.members && team.members.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Innovators & Exhibitors
            </div>
            <div className="flex flex-wrap gap-2">
              {team.members.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-blue-50/70 border border-blue-100 text-blue-900 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Users className="w-3 h-3 text-blue-600" />
                  <span>{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* External links */}
        {team.projectLinks && team.projectLinks.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
            {team.projectLinks.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
              >
                <span>{l.title}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Visitor Feedback & Cheer Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
            Visitor Engagement
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            Leave Feedback & Cheer for this Stall
          </h3>
          <p className="text-xs text-slate-500">
            Are you visiting this exhibition? Let the students know what impressed you!
          </p>
        </div>

        {submitted && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Thank you! Your feedback has been posted for the team.</span>
          </div>
        )}

        <form onSubmit={handleFeedbackSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Your Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Rivera"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">You Are</label>
              <select
                value={visitorType}
                onChange={(e) => setVisitorType(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Student Visitor">Student Visitor</option>
                <option value="Teacher / Faculty">Teacher / Faculty</option>
                <option value="Parent / Family">Parent / Family</option>
                <option value="Industry Professional">Industry Professional</option>
                <option value="General Public">General Public</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rating</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-slate-300 hover:text-amber-400 transition"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-600 ml-2">{rating} of 5 Stars</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Your Comment / Words of Encouragement
            </label>
            <textarea
              rows={3}
              required
              placeholder="What did you like about their demo or concept?"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Posting...' : 'Post Encouragement'}</span>
          </button>
        </form>
      </div>

      {/* Visitor Comments Feed */}
      {feedbackList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Visitor Notes ({feedbackList.length})
            </h4>
          </div>

          <div className="space-y-2">
            {feedbackList.map((fb) => (
              <div
                key={fb._id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{fb.visitorName}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({fb.visitorType})</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(fb.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{fb.comments}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
