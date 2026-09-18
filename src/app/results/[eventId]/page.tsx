'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Sparkles,
  Lock,
  Printer,
  ChevronRight,
  MapPin,
  Users,
} from 'lucide-react';
import { ITeamResult } from '@/lib/dataStore';

export default function PublicResultsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);
  const [results, setResults] = useState<ITeamResult[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/results/${eventId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Results not accessible');
          setIsPublished(false);
        } else {
          setEventData(data.event);
          setResults(data.results || []);
          setIsPublished(true);
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const categories = Array.from(new Set(results.map((r) => r.categoryName)));

  const filteredResults =
    selectedCategory === 'ALL'
      ? results
      : results.filter((r) => r.categoryName === selectedCategory);

  const topThree = filteredResults.slice(0, 3);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-slate-400">
        Loading official exhibition standings...
      </div>
    );
  }

  if (!isPublished) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Results In Deliberation</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || 'The evaluation committee is currently reviewing project scores. Official rankings will be published once approved.'}
        </p>
        <Link
          href="/"
          className="inline-block text-xs font-bold text-blue-600 hover:text-blue-700 pt-2"
        >
          Return to Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="space-y-3 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-blue-200 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Results & Final Rankings</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            {eventData?.title}
          </h1>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Congratulations to all participating teams, students, and evaluators for presenting groundbreaking projects and performances.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-xs hover:bg-blue-50 transition print:hidden"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print Official Results</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {topThree.length >= 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Podium Winners</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topThree.map((item, idx) => {
              const rankStyles = [
                {
                  badge: '1st Place (Gold)',
                  border: 'border-amber-300 bg-amber-50/50',
                  icon: <Crown className="w-6 h-6 text-amber-500" />,
                  medalBg: 'bg-amber-100 text-amber-900',
                },
                {
                  badge: '2nd Place (Silver)',
                  border: 'border-slate-300 bg-slate-50/50',
                  icon: <Medal className="w-6 h-6 text-slate-400" />,
                  medalBg: 'bg-slate-200 text-slate-800',
                },
                {
                  badge: '3rd Place (Bronze)',
                  border: 'border-amber-600/30 bg-orange-50/40',
                  icon: <Award className="w-6 h-6 text-amber-700" />,
                  medalBg: 'bg-amber-100 text-amber-900',
                },
              ][idx];

              return (
                <div
                  key={item.teamId}
                  className={`rounded-3xl border p-5 shadow-xs flex flex-col justify-between gap-3 ${rankStyles.border}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${rankStyles.medalBg}`}>
                        {rankStyles.badge}
                      </span>
                      {rankStyles.icon}
                    </div>

                    <div className="text-[11px] font-mono font-bold text-slate-500">
                      {item.teamCode} &bull; {item.tableNumber}
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex items-baseline justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Final Score:</span>
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900">{item.averageScore}</span>
                      <span className="text-[11px] text-slate-400 font-semibold"> / {item.maxScore}</span>
                      <span className="text-xs font-bold text-blue-600 ml-1">({item.percentage}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories ({results.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Complete Rankings Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Complete Scoreboard</h3>
          <span className="text-xs text-slate-400 font-medium">{filteredResults.length} Entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Stall #</th>
                <th className="py-3 px-4">Team Code</th>
                <th className="py-3 px-4">Project Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Avg Score</th>
                <th className="py-3 px-4 text-right">Score %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.map((row, idx) => (
                <tr key={row.teamId} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{row.tableNumber}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{row.teamCode}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">{row.title}</td>
                  <td className="py-3.5 px-4 text-slate-600">{row.categoryName}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {row.averageScore} <span className="text-[10px] text-slate-400">/ {row.maxScore}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-blue-600">
                    {row.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
