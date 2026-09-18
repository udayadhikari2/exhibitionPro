'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  FolderGit2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  QrCode,
  MapPin,
  ExternalLink,
  Edit,
  Save,
  Send,
  Paperclip,
  Trash2,
  FileText,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { ITeam, IEvent, ICategory } from '@/types';
import { generateQRCodeDataUrl } from '@/lib/qr';
import { formatDate } from '@/lib/utils';

export default function StudentTeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const teamId = params.id as string;

  const [team, setTeam] = useState<ITeam | null>(null);
  const [event, setEvent] = useState<IEvent | null>(null);
  const [category, setCategory] = useState<ICategory | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit/Revision Modal
  const [reviseModalOpen, setReviseModalOpen] = useState(false);
  const [revisedTitle, setRevisedTitle] = useState('');
  const [revisedDesc, setRevisedDesc] = useState('');
  const [revisedTech, setRevisedTech] = useState('');
  const [savingRevision, setSavingRevision] = useState(false);

  // QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const fetchTeamData = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Team not found');
      setTeam(data.team);
      setRevisedTitle(data.team.project?.title || data.team.teamName);
      setRevisedDesc(data.team.project?.shortDescription || '');
      setRevisedTech(data.team.project?.technologyUsed || '');

      // fetch event and category
      if (data.team.eventId) {
        const evtRes = await fetch(`/api/events/${data.team.eventId}`);
        const evtData = await evtRes.json();
        if (evtRes.ok) setEvent(evtData.event);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading team', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) fetchTeamData();
  }, [teamId]);

  const handleSaveRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    setSavingRevision(true);
    try {
      const res = await fetch(`/api/teams/${team._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            ...team.project,
            title: revisedTitle.trim(),
            shortDescription: revisedDesc.trim(),
            technologyUsed: revisedTech.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update submission');

      setTeam(data.team);
      setReviseModalOpen(false);
      showToast('Project revised and resubmitted for review!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error saving changes', 'error');
    } finally {
      setSavingRevision(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <LoadingState message="Loading team details & stall..." />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          title="Team Not Found"
          description="The requested team does not exist or has been removed."
          action={
            <Button variant="primary" onClick={() => router.push('/student/teams')}>
              Back to My Teams
            </Button>
          }
        />
      </div>
    );
  }

  const isApproved = team.status === 'APPROVED';
  const needsCorrection =
    team.status === 'CORRECTION_REQUIRED' || team.status === 'NEEDS_CORRECTION';
  const qrDataUrl = generateQRCodeDataUrl(team.qrCodeUrl || `http://localhost:3000/stall/${team.teamCode}`);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Back and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/student/teams"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Teams</span>
        </Link>

        <div className="flex items-center gap-2">
          {needsCorrection && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setReviseModalOpen(true)}
              icon={<Edit className="w-3.5 h-3.5" />}
            >
              Address Correction
            </Button>
          )}

          {isApproved && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setQrModalOpen(true)}
              icon={<QrCode className="w-3.5 h-3.5" />}
            >
              Stall QR Code
            </Button>
          )}
        </div>
      </div>

      {/* Correction Notice Banner */}
      {needsCorrection && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Committee Correction Request</span>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setReviseModalOpen(true)}
            >
              Update Project
            </Button>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            {team.correctionRemarks ||
              'Please adjust your project synopsis or technical documentation as requested by the evaluator committee.'}
          </p>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                {team.teamCode}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-xs font-semibold text-slate-500">
                {event?.name || 'Exhibition Event'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {team.teamName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                isApproved
                  ? 'success'
                  : needsCorrection
                  ? 'danger'
                  : team.status === 'SUBMITTED'
                  ? 'warning'
                  : 'neutral'
              }
              size="md"
            >
              {team.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {team.project?.shortDescription || 'No project description added yet.'}
        </p>

        {/* Highlights bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Institution</span>
            <span className="font-semibold text-slate-800 truncate block">
              {team.school || team.institution || 'Academic Institution'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Grade / Class</span>
            <span className="font-semibold text-slate-800 block">
              {team.grade || team.class || 'N/A'} (Section {team.section || 'A'})
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Exhibition Stall</span>
            {team.stallNumber ? (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                {team.stallNumber}
              </span>
            ) : (
              <span className="text-slate-400 font-medium">Pending Approval</span>
            )}
          </div>
        </div>
      </div>

      {/* Team Roster & Mentor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roster (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Team Members ({team.members?.length || 1})</h2>
            <span className="text-xs text-slate-400 font-mono">Official Roster</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {(team.members || []).map((m, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{m.name}</h4>
                    <span className="text-[11px] text-slate-500">
                      Roll: {m.rollNumber || m.rollNo || 'N/A'} &bull; {m.class || team.grade}
                    </span>
                  </div>
                </div>

                <Badge variant={idx === 0 ? 'primary' : 'neutral'} size="sm">
                  {m.role || 'Member'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Mentor / Faculty (1 col) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">Faculty Advisor</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Mentor Name</span>
              <span className="font-bold text-slate-800">{team.mentor?.name || 'None listed'}</span>
            </div>
            {team.mentor?.designation && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Designation</span>
                <span className="text-slate-600">{team.mentor.designation}</span>
              </div>
            )}
            {team.mentor?.email && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
                <span className="text-slate-600">{team.mentor.email}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Primary Contact</span>
              <span className="text-slate-600">{team.contact || team.teamLeader?.phone || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Synopsis & Files */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Overview &amp; Technical Scope</CardTitle>
              <CardDescription>{team.project?.title || team.teamName}</CardDescription>
            </div>
            <Link
              href={`/student/projects/${team._id}`}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Full Project View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {team.project?.problemStatement && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Problem Statement</span>
              <p className="text-slate-700 leading-relaxed mt-0.5">{team.project.problemStatement}</p>
            </div>
          )}

          {team.project?.methodology && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Methodology</span>
              <p className="text-slate-700 leading-relaxed mt-0.5">{team.project.methodology}</p>
            </div>
          )}

          {team.project?.technologyUsed && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Technology Stack</span>
              <p className="text-slate-700 font-medium mt-0.5">{team.project.technologyUsed}</p>
            </div>
          )}

          {/* Attached Files */}
          {(team.project?.files || []).length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Attached Documents ({team.project?.files?.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {team.project?.files?.map((f, idx) => (
                  <a
                    key={idx}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    <span>{f.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={`Exhibition Stall QR: ${team.teamCode}`}
      >
        <div className="text-center p-4 space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl inline-block shadow-sm">
            <img
              src={qrDataUrl}
              alt={team.teamCode}
              className="w-48 h-48 mx-auto"
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-900">{team.teamName}</div>
            <div className="text-xs font-mono text-emerald-700 font-semibold">
              Stall: {team.stallNumber || 'Assigned Table'}
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Visitors and judges can scan this code to view the live project showcase and rate this stall.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(`/stall/${team.teamCode}`, '_blank')}
              icon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Open Public Stall Page
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revise Modal */}
      <Modal
        isOpen={reviseModalOpen}
        onClose={() => setReviseModalOpen(false)}
        title="Revise Project Submission"
      >
        <form onSubmit={handleSaveRevision} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Project Title</label>
            <Input
              required
              value={revisedTitle}
              onChange={(e) => setRevisedTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Updated Synopsis / Description</label>
            <Textarea
              rows={4}
              required
              value={revisedDesc}
              onChange={(e) => setRevisedDesc(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tech Stack &amp; Components</label>
            <Input
              value={revisedTech}
              onChange={(e) => setRevisedTech(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReviseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={savingRevision}
              icon={<Send className="w-4 h-4" />}
            >
              {savingRevision ? 'Resubmitting...' : 'Resubmit for Review'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
