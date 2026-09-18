'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Users,
  Layers,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import DynamicRubricForm from '@/components/dynamic-rubric-form';
import { ITeam, IEvent, IEvaluationCriterion, IEvaluation } from '@/lib/types';

export default function EvaluateTeamPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const teamId = params.teamId as string;
  const eventId = searchParams.get('eventId') || 'evt_science_2026';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullAbstract, setShowFullAbstract] = useState(false);

  const [team, setTeam] = useState<ITeam | null>(null);
  const [event, setEvent] = useState<IEvent | null>(null);
  const [criteria, setCriteria] = useState<IEvaluationCriterion[]>([]);
  const [evaluation, setEvaluation] = useState<IEvaluation | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/evaluator/evaluate?teamId=${teamId}&eventId=${eventId}`);
      if (res.status === 403) {
        setError('Access Denied: You are not assigned to evaluate this project.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load evaluation sheet');

      setTeam(data.team);
      setEvent(data.event);
      setCriteria(data.criteria || []);
      setEvaluation(data.evaluation || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [teamId, eventId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading evaluation sheet...
      </div>
    );
  }

  if (error || !team || !event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error || 'Project data could not be retrieved.'}</span>
        </div>
        <Link
          href="/evaluator"
          className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assigned Projects</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/evaluator"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Assignments</span>
        </Link>

        <div className="text-right">
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
            {team.teamCode}
          </span>
        </div>
      </div>

      {/* Project Briefing Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs shadow-xs">
            <MapPin className="w-3.5 h-3.5" />
            <span>{team.tableNumber || 'Stall TBD'}</span>
          </div>

          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {event.eventType}
          </span>
        </div>

        <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
          {team.title}
        </h1>

        {/* Abstract Accordion */}
        <div className="text-xs text-slate-600 leading-relaxed pt-1">
          <p className={showFullAbstract ? '' : 'line-clamp-2'}>{team.abstract}</p>
          <button
            onClick={() => setShowFullAbstract(!showFullAbstract)}
            className="text-blue-600 font-semibold hover:underline mt-1 text-[11px] inline-flex items-center gap-1"
          >
            <span>{showFullAbstract ? 'Show less' : 'Read full abstract'}</span>
            {showFullAbstract ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {team.techStack && (
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-700">Technology / Materials:</span> {team.techStack}
          </div>
        )}

        {/* Team Members List */}
        {team.members && team.members.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-medium">Members:</span>
            {team.members.map((m, i) => (
              <span
                key={i}
                className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md"
              >
                {m.name} {m.role ? `(${m.role})` : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Rubric Assessment Form */}
      <DynamicRubricForm
        event={event}
        team={team}
        criteria={criteria}
        existingEvaluation={evaluation}
        onSubmitted={() => fetchData()}
      />
    </div>
  );
}
