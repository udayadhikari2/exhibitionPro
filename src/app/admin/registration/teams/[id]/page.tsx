'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  QrCode,
  MapPin,
  ExternalLink,
  Users,
  Paperclip,
  Building,
  ShieldCheck,
  Send,
  Sliders,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { ITeam, IEvent, ICategory, TeamStatus } from '@/types';
import { generateQRCodeDataUrl } from '@/lib/qr';
import { formatDate } from '@/lib/utils';

export default function AdminTeamReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const [team, setTeam] = useState<ITeam | null>(null);
  const [event, setEvent] = useState<IEvent | null>(null);
  const [category, setCategory] = useState<ICategory | null>(null);
  const [loading, setLoading] = useState(true);

  // Decision state
  const [stallNumber, setStallNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<'APPROVE' | 'CORRECTION' | 'REJECT' | 'QR' | null>(null);

  const fetchTeamDetails = async () => {
    try {
      const res = await fetch(`/api/teams/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Team not found');
      setTeam(data.team);
      setStallNumber(data.team.stallNumber || data.team.tableNumber || '');
      setRemarks(data.team.correctionRemarks || '');

      if (data.team.eventId) {
        const evtRes = await fetch(`/api/events/${data.team.eventId}`);
        const evtData = await evtRes.json();
        if (evtRes.ok) setEvent(evtData.event);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading registration details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTeamDetails();
  }, [id]);

  const handleDecision = async (status: TeamStatus) => {
    if (!team) return;

    if (status === 'APPROVED' && !stallNumber.trim()) {
      showToast('Please allocate a stall or table number before approval', 'error');
      return;
    }
    if ((status === 'CORRECTION_REQUIRED' || status === 'REJECTED') && !remarks.trim()) {
      showToast('Please provide remarks explaining the decision', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/teams/${team._id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          stallNumber: stallNumber.trim(),
          remarks: remarks.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update decision');

      setTeam(data.team);
      setActiveModal(null);
      showToast(`Registration status updated to ${status}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Decision failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <LoadingState message="Loading team registration dossier..." />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          title="Team Registration Not Found"
          description="The requested team ID does not exist or has been removed."
          action={
            <Button variant="primary" onClick={() => router.push('/admin/registration')}>
              Back to Registration Review
            </Button>
          }
        />
      </div>
    );
  }

  const isApproved = team.status === 'APPROVED';
  const qrDataUrl = generateQRCodeDataUrl(
    team.qrCodeUrl || `http://localhost:3000/stall/${team.teamCode}`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top back link and action status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/admin/registration"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Registration Review Console</span>
        </Link>

        {isApproved && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setActiveModal('QR')}
            icon={<QrCode className="w-3.5 h-3.5" />}
          >
            View Stall QR Code
          </Button>
        )}
      </div>

      {/* Main Dossier Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                {team.teamCode}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-xs text-slate-500 font-semibold">{event?.name || 'Exhibition'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {team.teamName}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Review Status:</span>
            <Badge
              variant={
                isApproved
                  ? 'success'
                  : team.status === 'CORRECTION_REQUIRED'
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
          {team.project?.shortDescription || 'No project description submitted.'}
        </p>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Institution / School</span>
            <span className="font-semibold text-slate-800 truncate block">
              {team.school || team.institution || 'Academic Institution'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Grade &amp; Section</span>
            <span className="font-semibold text-slate-800 block">
              {team.grade || team.class || 'N/A'} (Sec {team.section || 'A'})
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Allocated Stall</span>
            {team.stallNumber ? (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                {team.stallNumber}
              </span>
            ) : (
              <span className="text-slate-400 font-medium">Not yet allocated</span>
            )}
          </div>
        </div>
      </div>

      {/* Decision Action Panel */}
      <Card className="border-2 border-blue-100 bg-blue-50/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <CardTitle>Steering Committee Review Decision</CardTitle>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Current: <strong>{team.status.replace(/_/g, ' ')}</strong>
            </span>
          </div>
          <CardDescription>
            Approve with stall allocation, request project revisions, or decline application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setActiveModal('APPROVE')}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Approve &amp; Allocate Stall
            </Button>

            <Button
              variant="secondary"
              onClick={() => setActiveModal('CORRECTION')}
              icon={<AlertTriangle className="w-4 h-4" />}
            >
              Request Correction
            </Button>

            <Button
              variant="danger"
              onClick={() => setActiveModal('REJECT')}
              icon={<XCircle className="w-4 h-4" />}
            >
              Reject Application
            </Button>
          </div>

          {team.correctionRemarks && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold text-amber-950">Existing Remarks on File:</div>
              <p className="text-[11px] text-amber-800">{team.correctionRemarks}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roster Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Member Roster ({team.members?.length || 1})</CardTitle>
              <CardDescription>Verified student participants</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white text-xs">
            {(team.members || []).map((m, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{m.name}</h4>
                    <span className="text-[11px] text-slate-500">
                      Roll: {m.rollNumber || m.rollNo || 'N/A'} &bull; {m.class || team.grade} ({m.section || team.section})
                    </span>
                  </div>
                </div>

                <Badge variant={idx === 0 ? 'primary' : 'neutral'} size="sm">
                  {m.role || 'Member'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Technical Scope */}
      <Card>
        <CardHeader>
          <CardTitle>Project Technical Dossier</CardTitle>
          <CardDescription>{team.project?.title || team.teamName}</CardDescription>
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
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Methodology &amp; Design</span>
              <p className="text-slate-700 leading-relaxed mt-0.5">{team.project.methodology}</p>
            </div>
          )}

          {team.project?.innovation && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Key Innovation</span>
              <p className="text-slate-700 leading-relaxed mt-0.5">{team.project.innovation}</p>
            </div>
          )}

          {team.project?.technologyUsed && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Technology Stack</span>
              <p className="text-slate-800 font-medium mt-0.5">{team.project.technologyUsed}</p>
            </div>
          )}

          {/* Attached Files */}
          {(team.project?.files || []).length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Submitted Documents &amp; Media ({team.project?.files?.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {team.project?.files?.map((f, idx) => (
                  <a
                    key={idx}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
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

      {/* Modal: APPROVE */}
      <Modal
        isOpen={activeModal === 'APPROVE'}
        onClose={() => setActiveModal(null)}
        title="Approve Team &amp; Allocate Stall"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Approving this team will transition its status to <strong>APPROVED</strong>, issue a public stall QR code, and assign its physical table location on the exhibition floor.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Exhibition Stall / Table Number <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="e.g. Stall A-14, Booth 02, Table 3B"
              value={stallNumber}
              onChange={(e) => setStallNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Optional Confirmation Note</label>
            <Textarea
              rows={2}
              placeholder="e.g. Approved for Main Hall exhibition. Power socket provided at stall."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setActiveModal(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={actionLoading}
              onClick={() => handleDecision('APPROVED')}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {actionLoading ? 'Approving...' : 'Confirm Approval & Stall'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: REQUEST CORRECTION */}
      <Modal
        isOpen={activeModal === 'CORRECTION'}
        onClose={() => setActiveModal(null)}
        title="Request Project Correction"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            The team will be marked as <strong>CORRECTION_REQUIRED</strong>. The student leader will be prompted with your remarks to revise and resubmit.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Specific Correction Remarks <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={4}
              required
              placeholder="Detail what needs to be changed (e.g. Update abstract, upload PDF synopsis, verify member roll number)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setActiveModal(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={actionLoading}
              onClick={() => handleDecision('CORRECTION_REQUIRED')}
              icon={<AlertTriangle className="w-4 h-4" />}
            >
              {actionLoading ? 'Sending...' : 'Send Correction Notice'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: REJECT */}
      <Modal
        isOpen={activeModal === 'REJECT'}
        onClose={() => setActiveModal(null)}
        title="Reject Team Registration"
      >
        <div className="space-y-4">
          <p className="text-xs text-rose-700 leading-relaxed">
            Are you sure you want to reject this team registration? The team will be declined from participation.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <Textarea
              rows={3}
              required
              placeholder="e.g. Ineligible category, duplicate submission, or rule non-compliance..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setActiveModal(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={actionLoading}
              onClick={() => handleDecision('REJECTED')}
              icon={<XCircle className="w-4 h-4" />}
            >
              {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: QR CODE BADGE */}
      <Modal
        isOpen={activeModal === 'QR'}
        onClose={() => setActiveModal(null)}
        title={`Official Stall QR: ${team.teamCode}`}
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
            <div className="text-sm font-bold text-slate-900">{team.teamName}</div>
            <div className="text-xs font-mono text-emerald-700 font-bold">
              {team.stallNumber || 'Allocated Exhibition Table'}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              {team.qrCodeUrl || `http://localhost:3000/stall/${team.teamCode}`}
            </div>
          </div>

          <div className="flex justify-center gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(`/stall/${team.teamCode}`, '_blank')}
              icon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Open Live Stall Page
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
