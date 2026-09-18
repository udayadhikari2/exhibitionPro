'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Paperclip,
  ExternalLink,
  Layers,
  Cpu,
  Boxes,
  Compass,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { ITeam } from '@/types';

export default function StudentProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const [team, setTeam] = useState<ITeam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/teams/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Project not found');
        setTeam(data.team);
      } catch (err: any) {
        showToast(err.message || 'Error loading project', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTeam();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <LoadingState message="Loading project synopsis..." />
      </div>
    );
  }

  if (!team || !team.project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          title="Project Not Found"
          description="The requested project synopsis does not exist."
          action={
            <Button variant="primary" onClick={() => router.push('/student/teams')}>
              Back to Teams
            </Button>
          }
        />
      </div>
    );
  }

  const proj = team.project;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href={`/student/teams/${team._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Team: {team.teamName}</span>
        </Link>
      </div>

      <PageHeader
        badge="Project Dossier"
        title={proj.title || team.teamName}
        description={`Registered under team ${team.teamCode} &bull; ${team.school || 'Academic Institution'}`}
      />

      {/* Main Synopsis Card */}
      <Card>
        <CardHeader>
          <CardTitle>Abstract &amp; Executive Summary</CardTitle>
          <CardDescription>High-level overview presented to exhibition evaluators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {proj.shortDescription || 'No abstract provided.'}
        </CardContent>
      </Card>

      {/* Structured Technical Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {proj.problemStatement && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <CardTitle>Problem Statement</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {proj.problemStatement}
            </CardContent>
          </Card>
        )}

        {proj.objectives && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <CardTitle>Objectives &amp; Scope</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {proj.objectives}
            </CardContent>
          </Card>
        )}

        {proj.methodology && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <CardTitle>Methodology &amp; Architecture</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {proj.methodology}
            </CardContent>
          </Card>
        )}

        {proj.innovation && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <CardTitle>Key Innovation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {proj.innovation}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Technical Specifications Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <CardTitle>Technical Components &amp; Cost</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Technology Used</span>
              <span className="font-semibold text-slate-800">{proj.technologyUsed || 'N/A'}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Materials &amp; Hardware</span>
              <span className="font-semibold text-slate-800">{proj.materials || 'N/A'}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Cost</span>
              <span className="font-semibold text-slate-800">{proj.projectCost ? String(proj.projectCost) : 'N/A'}</span>
            </div>
          </div>

          {(proj.expectedOutcome || proj.futureScope) && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {proj.expectedOutcome && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected Outcome</span>
                  <p className="text-slate-600 mt-1">{proj.expectedOutcome}</p>
                </div>
              )}

              {proj.futureScope && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Future Roadmap</span>
                  <p className="text-slate-600 mt-1">{proj.futureScope}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attached Files Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-blue-600" />
              <CardTitle>Attached Files &amp; Media ({proj.files?.length || 0})</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!proj.files || proj.files.length === 0 ? (
            <p className="text-xs text-slate-400">No media files or documents uploaded for this project.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {proj.files.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-slate-800 truncate">{file.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{file.type}</div>
                    </div>
                  </div>

                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-[11px] hover:bg-blue-50 hover:text-blue-600 transition-colors shrink-0"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
