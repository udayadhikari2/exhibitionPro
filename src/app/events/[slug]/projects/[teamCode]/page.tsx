'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Users,
  Layers,
  Sparkles,
  Calendar,
  Share2,
  FileText,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Star,
  Send,
  MessageSquare,
  Cpu,
  Target,
  Lightbulb,
  Workflow,
  Compass,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import QRBadge from '@/components/qr-badge';
import { IPublicProject } from '@/types';
import { formatDate } from '@/lib/utils';

export default function PublicProjectShowcasePage({
  params,
}: {
  params: Promise<{ slug: string; teamCode: string }>;
}) {
  const { slug, teamCode } = use(params);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [project, setProject] = useState<IPublicProject | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Visitor feedback form states
  const [visitorName, setVisitorName] = useState('');
  const [visitorType, setVisitorType] = useState('General Visitor');
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [slug, teamCode]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/public/events/${slug}/projects/${teamCode}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Project not found');
      setEvent(data.event);
      setProject(data.project);
    } catch (err: any) {
      showToast(err.message || 'Error loading project', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project?.projectTitle || 'Exhibition Project',
        text: `Check out ${project?.projectTitle} by ${project?.teamName} at ${event?.name || 'Exhibition'}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Project link copied to clipboard!', 'success');
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !visitorName.trim() || !feedbackComment.trim()) {
      showToast('Please provide your name and comments', 'warning');
      return;
    }

    try {
      setSubmittingFeedback(true);
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: project.id,
          visitorName,
          visitorType,
          rating,
          comments: feedbackComment,
        }),
      });

      if (res.ok) {
        setFeedbackSubmitted(true);
        setFeedbackComment('');
        showToast('Thank you! Your feedback was recorded.', 'success');
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Failed to submit feedback');
      }
    } catch (err: any) {
      showToast(err.message || 'Error submitting feedback', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <LoadingState message={`Loading project ${teamCode.toUpperCase()} showcase...`} />
      </div>
    );
  }

  if (!project || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          title="Project Not Found"
          description={`We couldn't find project ${teamCode.toUpperCase()} in this exhibition. Please verify the stall number or code.`}
          action={
            <Link href={`/events/${slug}`}>
              <Button variant="primary">Return to Exhibition</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const techTags = (project.technologyUsed || '')
    .split(/[,;\n]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const materialsTags = (project.materials || '')
    .split(/[,;\n]/)
    .map((m) => m.trim())
    .filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Breadcrumb / Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/events/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to {event.name}</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowQRModal(true)}
            icon={<QrCode className="w-3.5 h-3.5 text-blue-600" />}
          >
            Stall QR Card
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleShare}
            icon={<Share2 className="w-3.5 h-3.5" />}
          >
            Share
          </Button>
        </div>
      </div>

      {/* Main Hero Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs p-6 sm:p-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary" size="md">
              {project.category.name}
            </Badge>

            {project.stallNumber && (
              <span className="px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-full text-xs font-black uppercase tracking-wider">
                Stall / Booth #{project.stallNumber}
              </span>
            )}

            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-xs font-mono font-bold">
              {project.teamCode}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-emerald-800">Certified Exhibition Entry</span>
          </div>
        </div>

        {/* Project Title & Short Abstract */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {project.projectTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            {project.shortDescription}
          </p>
        </div>

        {/* Institutional & Team Identity Bar */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Team Name</div>
            <div className="font-bold text-slate-900 text-sm">{project.teamName}</div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Institution / School</div>
            <div className="font-semibold text-slate-800">
              {project.school || project.institution || 'Institutional Team'}
              {(project.class || project.grade) && (
                <span className="text-slate-500"> &bull; Class {project.class || project.grade}</span>
              )}
            </div>
          </div>

          {project.mentorName && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Mentor / Guide</div>
              <div className="font-semibold text-slate-800">
                {project.mentorName}
                {project.mentorDesignation && (
                  <span className="text-slate-500"> ({project.mentorDesignation})</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Main Specifications & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Detailed Problem Statement & Objectives */}
          {(project.problemStatement || project.objectives) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <CardTitle>Problem Statement &amp; Objectives</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {project.problemStatement && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Problem Context
                    </h4>
                    <p className="whitespace-pre-line">{project.problemStatement}</p>
                  </div>
                )}

                {project.objectives && (
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Project Objectives
                    </h4>
                    <p className="whitespace-pre-line">{project.objectives}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Methodology & Innovation */}
          {(project.methodology || project.innovation) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <CardTitle>Methodology &amp; Innovation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {project.methodology && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Implementation Methodology
                    </h4>
                    <p className="whitespace-pre-line">{project.methodology}</p>
                  </div>
                )}

                {project.innovation && (
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Novelty &amp; Innovation Aspect
                    </h4>
                    <p className="whitespace-pre-line">{project.innovation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Expected Outcome & Future Scope */}
          {(project.expectedOutcome || project.futureScope) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-emerald-600" />
                  <CardTitle>Outcomes &amp; Future Scope</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {project.expectedOutcome && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Demonstrated Results
                    </h4>
                    <p className="whitespace-pre-line">{project.expectedOutcome}</p>
                  </div>
                )}

                {project.futureScope && (
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Future Scalability
                    </h4>
                    <p className="whitespace-pre-line">{project.futureScope}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Video Showcase (if configured) */}
          {project.videoUrl && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-600" />
                  <CardTitle>Video Demonstration</CardTitle>
                </div>
                <CardDescription>Live demonstration and walkthrough of the working exhibit.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                  {project.videoUrl.includes('youtube.com') || project.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={project.videoUrl.replace('watch?v=', 'embed/')}
                      title="Project Demonstration Video"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={project.videoUrl} controls className="w-full h-full object-contain" />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prototype Gallery */}
          {project.gallery && project.gallery.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <CardTitle>Prototype Gallery &amp; Photos</CardTitle>
                </div>
                <CardDescription>Visual exhibition of hardware, schematics, and prototype build.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.gallery.map((imgUrl, i) => (
                    <div
                      key={i}
                      className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group relative"
                    >
                      <img
                        src={imgUrl}
                        alt={`${project.projectTitle} - photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Public Project Documents */}
          {project.documents && project.documents.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <CardTitle>Public Reports &amp; Documentation</CardTitle>
                </div>
                <CardDescription>Download project posters, research papers, and technical specifications.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.documents.map((doc, i) => (
                    <a
                      key={i}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-xs transition flex items-center justify-between group text-xs font-semibold text-slate-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">{doc.name}</span>
                      </div>
                      <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Team Members Card (Strictly Sanitized: Name, Role, Class) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <CardTitle>Team Members</CardTitle>
              </div>
              <CardDescription>{project.members.length} registered student innovators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {project.members.map((member, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{member.name}</div>
                      {member.class && (
                        <div className="text-[10px] text-slate-500">Grade / Class {member.class}</div>
                      )}
                    </div>
                    <Badge variant="neutral" size="sm">
                      {member.role || 'Member'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tech Stack & Materials Tags */}
          {(techTags.length > 0 || materialsTags.length > 0) && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <CardTitle>Tech &amp; Components</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {techTags.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Technology &amp; Tools</div>
                    <div className="flex flex-wrap gap-1.5">
                      {techTags.map((tech, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {materialsTags.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Materials &amp; Hardware</div>
                    <div className="flex flex-wrap gap-1.5">
                      {materialsTags.map((mat, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium"
                        >
                          {mat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Visitor Feedback Card */}
          <Card className="bg-gradient-to-b from-white to-blue-50/40 border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <CardTitle>Leave Stall Feedback</CardTitle>
              </div>
              <CardDescription>
                Visiting Booth #{project.stallNumber || project.teamCode}? Send praise or questions to the team!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2 text-xs">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <div className="font-bold text-emerald-900">Feedback Submitted!</div>
                  <p className="text-emerald-700">Thank you for encouraging our student innovators.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFeedbackSubmitted(false)}
                    className="mt-2 text-xs"
                  >
                    Submit Another Note
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="e.g. Dr. Jane Smith / Parent"
                      required
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Visitor Role</label>
                    <select
                      value={visitorType}
                      onChange={(e) => setVisitorType(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="General Visitor">General Visitor</option>
                      <option value="Parent / Guardian">Parent / Guardian</option>
                      <option value="Industry Professional">Industry Professional</option>
                      <option value="Teacher / Educator">Teacher / Educator</option>
                      <option value="Student Peer">Student Peer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className="p-1 text-amber-500 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${s <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-600 ml-1">{rating} / 5</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Comments &amp; Encouragement</label>
                    <textarea
                      rows={3}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Great prototype! Very impressed by the automated sensor logic..."
                      required
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={submittingFeedback}
                    icon={<Send className="w-3.5 h-3.5" />}
                  >
                    {submittingFeedback ? 'Submitting...' : 'Post Visitor Review'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Printable Stall QR Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Official Stall QR Card"
        size="md"
      >
        <div className="p-4">
          <QRBadge
            teamCode={project.teamCode}
            stallNumber={project.stallNumber}
            projectTitle={project.projectTitle}
            teamName={project.teamName}
            categoryName={project.category.name}
            institution={project.school || project.institution}
            eventTitle={event.name}
            eventSlug={slug}
          />
        </div>
      </Modal>
    </div>
  );
}
