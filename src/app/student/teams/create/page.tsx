'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Users,
  FolderGit2,
  FileText,
  UploadCloud,
  FileCheck,
  Send,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';
import { IEvent, ICategory, ITeamMember, IProjectFile, ISessionUser } from '@/types';

const STEPS = [
  { id: 1, label: 'Team', desc: 'Category & School' },
  { id: 2, label: 'Members', desc: 'Roster & Roles' },
  { id: 3, label: 'Project', desc: 'Title & Synopsis' },
  { id: 4, label: 'Files', desc: 'Media & Documents' },
  { id: 5, label: 'Review', desc: 'Verify Details' },
  { id: 6, label: 'Submit', desc: 'Confirmation' },
];

export default function CreateTeamPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [currentUser, setCurrentUser] = useState<ISessionUser | null>(null);

  // Available options
  const [events, setEvents] = useState<IEvent[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Step 1: Team
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [grade, setGrade] = useState('Grade 11');
  const [section, setSection] = useState('A');
  const [school, setSchool] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');
  const [mentorPhone, setMentorPhone] = useState('');
  const [mentorDesignation, setMentorDesignation] = useState('Faculty Advisor / Mentor');
  const [contactPhone, setContactPhone] = useState('');

  // Step 2: Members
  const [members, setMembers] = useState<ITeamMember[]>([
    {
      name: '',
      class: 'Grade 11',
      section: 'A',
      rollNumber: '01',
      role: 'Team Lead',
      contact: '',
    },
  ]);

  // Step 3: Project
  const [projectTitle, setProjectTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [objectives, setObjectives] = useState('');
  const [methodology, setMethodology] = useState('');
  const [innovation, setInnovation] = useState('');
  const [materials, setMaterials] = useState('');
  const [technologyUsed, setTechnologyUsed] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [futureScope, setFutureScope] = useState('');
  const [projectCost, setProjectCost] = useState('');

  // Step 4: Files
  const [files, setFiles] = useState<IProjectFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [createdTeamCode, setCreatedTeamCode] = useState('');
  const [createdTeamId, setCreatedTeamId] = useState('');

  // Load session and events
  useEffect(() => {
    const init = async () => {
      try {
        const [authRes, eventsRes] = await Promise.all([
          fetch('/api/auth'),
          fetch('/api/events'),
        ]);

        const authData = await authRes.json();
        if (authData?.user) {
          setCurrentUser(authData.user);
          setSchool(authData.user.institution || '');
          setMembers([
            {
              name: authData.user.name,
              class: 'Grade 11',
              section: 'A',
              rollNumber: '01',
              role: 'Team Lead',
              contact: '',
              email: authData.user.email,
            },
          ]);
        }

        const eventsData = await eventsRes.json();
        if (eventsData?.events) {
          const eligibleEvents = eventsData.events.filter(
            (e: IEvent) => e.status !== 'ARCHIVED'
          );
          setEvents(eligibleEvents);
          if (eligibleEvents.length > 0) {
            setSelectedEventId(eligibleEvents[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInitial(false);
      }
    };

    init();
  }, []);

  // Fetch categories when event changes
  useEffect(() => {
    if (!selectedEventId) {
      setCategories([]);
      return;
    }

    const fetchCategories = async () => {
      try {
        const res = await fetch(`/api/events/${selectedEventId}/categories`);
        const data = await res.json();
        const activeCats = (data.categories || []).filter(
          (c: ICategory) => c.status === 'ACTIVE'
        );
        setCategories(activeCats);
        if (activeCats.length > 0) {
          setSelectedCategoryId(activeCats[0]._id);
        } else {
          setSelectedCategoryId('');
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchCategories();
  }, [selectedEventId]);

  // Member roster helpers
  const handleAddMember = () => {
    if (members.length >= 6) {
      showToast('Maximum 6 team members permitted for this competition', 'error');
      return;
    }
    setMembers([
      ...members,
      {
        name: '',
        class: grade,
        section,
        rollNumber: String(members.length + 1).padStart(2, '0'),
        role: 'Researcher / Hardware',
        contact: '',
      },
    ]);
  };

  const handleRemoveMember = (index: number) => {
    if (members.length <= 1) {
      showToast('A team must have at least 1 member (Team Leader)', 'error');
      return;
    }
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, field: keyof ITeamMember, val: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: val };
    setMembers(updated);
  };

  // File Upload Helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        const formData = new FormData();
        formData.append('file', f);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.file) {
          setFiles((prev) => [...prev, data.file]);
          showToast(`Uploaded: ${f.name}`, 'success');
        } else {
          showToast(data.error || `Failed to upload ${f.name}`, 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'File upload failed', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Step Validation & Progression
  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedEventId) return showToast('Please select an event', 'error');
      if (!selectedCategoryId) return showToast('Please select an event category', 'error');
      if (!teamName.trim()) return showToast('Please enter a team name', 'error');
      if (!school.trim()) return showToast('Please enter your school or institution', 'error');
    } else if (currentStep === 2) {
      for (let i = 0; i < members.length; i++) {
        if (!members[i].name.trim()) {
          return showToast(`Please provide a name for member #${i + 1}`, 'error');
        }
      }
    } else if (currentStep === 3) {
      if (!projectTitle.trim()) return showToast('Please enter a project title', 'error');
      if (!shortDescription.trim()) return showToast('Please enter a short project description', 'error');
    }

    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submission handler
  const handleSubmitRegistration = async (status: 'DRAFT' | 'SUBMITTED') => {
    setSubmitting(true);
    try {
      const payload = {
        eventId: selectedEventId,
        categoryId: selectedCategoryId,
        teamName: teamName.trim(),
        grade: grade.trim(),
        class: grade.trim(),
        section: section.trim(),
        school: school.trim(),
        institution: school.trim(),
        teamLeader: {
          name: members[0]?.name || currentUser?.name || 'Leader',
          email: currentUser?.email || 'student@portal.edu',
          phone: contactPhone.trim(),
          userId: currentUser?.id,
        },
        contact: contactPhone.trim(),
        mentor: {
          name: mentorName.trim(),
          email: mentorEmail.trim(),
          phone: mentorPhone.trim(),
          designation: mentorDesignation.trim(),
        },
        status,
        members,
        project: {
          title: projectTitle.trim(),
          shortDescription: shortDescription.trim(),
          problemStatement: problemStatement.trim(),
          objectives: objectives.trim(),
          methodology: methodology.trim(),
          innovation: innovation.trim(),
          materials: materials.trim(),
          technologyUsed: technologyUsed.trim(),
          expectedOutcome: expectedOutcome.trim(),
          futureScope: futureScope.trim(),
          projectCost: projectCost.trim(),
          files,
        },
      };

      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register team');
      }

      setCreatedTeamCode(data.team.teamCode);
      setCreatedTeamId(data.team._id);
      setCurrentStep(6);
      showToast(
        status === 'SUBMITTED' ? 'Team submitted for review!' : 'Draft saved successfully!',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Error submitting registration', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <LoadingState message="Preparing registration wizard..." />
      </div>
    );
  }

  const selectedEvent = events.find((e) => e._id === selectedEventId);
  const selectedCategory = categories.find((c) => c._id === selectedCategoryId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top back link */}
      <div>
        <Link
          href="/student/teams"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Teams</span>
        </Link>
      </div>

      {/* Stepper Wizard Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
              Registration Wizard &bull; Step {currentStep} of 6
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {STEPS[currentStep - 1].label}: {STEPS[currentStep - 1].desc}
            </h1>
          </div>
          <div className="text-xs font-bold text-slate-400 font-mono">
            {Math.round((currentStep / 6) * 100)}% Complete
          </div>
        </div>

        {/* Stepper Indicators */}
        <div className="grid grid-cols-6 gap-2">
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;
            return (
              <div
                key={s.id}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? 'bg-blue-600'
                    : isCompleted
                    ? 'bg-emerald-500'
                    : 'bg-slate-100'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* STEP 1: TEAM & INSTITUTION */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>1. Select Event, Category &amp; Team Name</CardTitle>
            <CardDescription>
              Assign your team to an exhibition discipline and provide institution details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Exhibition / Competition <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  options={events.map((e) => ({
                    value: e._id,
                    label: `${e.name} (${e.eventType})`,
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Discipline Category <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  options={categories.map((c) => ({
                    value: c._id,
                    label: c.name,
                  }))}
                  disabled={categories.length === 0}
                />
                {categories.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No categories configured yet for this event.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Team Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Nexus Innovators, SolarBotics"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  School / College / Institution <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Cambridge Science Institute"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Class / Grade</label>
                <Input
                  placeholder="e.g. Grade 11, Year 2"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section</label>
                <Input
                  placeholder="e.g. A, B, CS-1"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Phone</label>
                <Input
                  placeholder="+1 (555) 019-2834"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Faculty Advisor / Teacher Mentor</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mentor Name</label>
                  <Input
                    placeholder="Prof. or Teacher Name"
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mentor Email</label>
                  <Input
                    placeholder="mentor@school.edu"
                    value={mentorEmail}
                    onChange={(e) => setMentorEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Designation</label>
                  <Input
                    placeholder="Physics Teacher / Advisor"
                    value={mentorDesignation}
                    onChange={(e) => setMentorDesignation(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="primary" onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
              Continue to Members
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: TEAM MEMBERS */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>2. Team Member Roster</CardTitle>
                <CardDescription>
                  Specify team members, roles, and roll numbers (1 to 6 members).
                </CardDescription>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddMember}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Member
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {members.map((member, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px]">
                      {idx + 1}
                    </span>
                    <span>{idx === 0 ? 'Team Leader' : `Member ${idx + 1}`}</span>
                  </span>

                  {idx > 0 && (
                    <button
                      onClick={() => handleRemoveMember(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="Student Name"
                      value={member.name}
                      onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role</label>
                    <Input
                      placeholder="e.g. Lead, Hardware, Software"
                      value={member.role}
                      onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Roll Number</label>
                    <Input
                      placeholder="e.g. 23-CS-041"
                      value={member.rollNumber}
                      onChange={(e) => handleMemberChange(idx, 'rollNumber', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Class / Grade</label>
                    <Input
                      value={member.class}
                      onChange={(e) => handleMemberChange(idx, 'class', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Section</label>
                    <Input
                      value={member.section}
                      onChange={(e) => handleMemberChange(idx, 'section', e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Phone</label>
                    <Input
                      placeholder="Optional"
                      value={member.contact}
                      onChange={(e) => handleMemberChange(idx, 'contact', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Button variant="secondary" onClick={handleBack} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button variant="primary" onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
              Continue to Project
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: PROJECT INFORMATION */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Project Title &amp; Technical Synopsis</CardTitle>
            <CardDescription>
              Detail your exhibition prototype, methodology, and technology stack.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Autonomous Wildfire Monitoring Drone with Edge ML"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Short Description &amp; Abstract <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={3}
                required
                placeholder="High-level overview of the exhibit (displayed on public catalog and evaluator tablets)..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Problem Statement</label>
                <Textarea
                  rows={2}
                  placeholder="What real-world challenge or question does this project solve?"
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Objectives</label>
                <Textarea
                  rows={2}
                  placeholder="Specific goals and measurable outcomes targeted..."
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Methodology &amp; Architecture</label>
                <Textarea
                  rows={2}
                  placeholder="Steps taken, design iterations, algorithms used..."
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Key Innovation</label>
                <Textarea
                  rows={2}
                  placeholder="What makes this project uniquely innovative compared to existing solutions?"
                  value={innovation}
                  onChange={(e) => setInnovation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Technology Used</label>
                <Input
                  placeholder="e.g. React, Python, Arduino, ESP32"
                  value={technologyUsed}
                  onChange={(e) => setTechnologyUsed(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Materials / Hardware</label>
                <Input
                  placeholder="e.g. Microcontroller, LiDAR, Acrylic"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Project Cost</label>
                <Input
                  placeholder="e.g. $120 / NPR 15,000"
                  value={projectCost}
                  onChange={(e) => setProjectCost(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Button variant="secondary" onClick={handleBack} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button variant="primary" onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
              Continue to Files
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 4: FILES UPLOAD */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>4. Project Documents, Photos &amp; Presentations</CardTitle>
            <CardDescription>
              Upload project photos, synopsis report (PDF), or slide deck (PPTX/PDF).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Dropzone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-3xl p-8 text-center transition-colors bg-slate-50/50">
              <UploadCloud className="w-10 h-10 text-blue-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900">Upload Project Documents</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Select images (JPG, PNG), PDF reports, or presentation slides.
              </p>

              <div className="mt-4">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-xs transition-colors">
                  <span>{isUploading ? 'Uploading...' : 'Choose Files'}</span>
                  <input
                    type="file"
                    multiple
                    disabled={isUploading}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.ppt,.pptx"
                  />
                </label>
              </div>
            </div>

            {/* Uploaded files list */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900">
                  Attached Files ({files.length})
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3 sm:p-4 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                        <Badge variant="neutral" size="sm">
                          {file.type}
                        </Badge>
                      </div>

                      <button
                        onClick={() => handleRemoveFile(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Button variant="secondary" onClick={handleBack} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button variant="primary" onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
              Continue to Review
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 5: REVIEW */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>5. Review Registration Details</CardTitle>
            <CardDescription>
              Double check all team, member, and project information before submission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-xs">
            {/* Event & Category banner */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Target Competition
                </span>
                <h4 className="text-sm font-black text-blue-950">{selectedEvent?.name}</h4>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Category: <strong>{selectedCategory?.name || 'General'}</strong>
                </p>
              </div>
              <Badge variant="primary" size="md">
                {selectedEvent?.eventType}
              </Badge>
            </div>

            {/* Team Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Team Name</span>
                <span className="text-sm font-bold text-slate-900">{teamName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">School / College</span>
                <span className="text-sm font-bold text-slate-900">{school}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Grade / Section</span>
                <span className="text-slate-700 font-semibold">
                  {grade} &bull; Section {section}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mentor</span>
                <span className="text-slate-700 font-semibold">
                  {mentorName || 'None listed'} {mentorDesignation ? `(${mentorDesignation})` : ''}
                </span>
              </div>
            </div>

            {/* Member Roster */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900">
                Team Members ({members.length})
              </h4>
              <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white">
                {members.map((m, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{m.name}</span>
                      <span className="text-[11px] text-slate-500 ml-2">
                        Roll: {m.rollNumber} &bull; {m.class} ({m.section})
                      </span>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Synopsis */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Project Title</span>
              <h4 className="text-sm font-bold text-slate-900">{projectTitle}</h4>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{shortDescription}</p>

              {technologyUsed && (
                <div className="pt-2 text-[11px] text-slate-500">
                  Tech Stack: <strong className="text-slate-700">{technologyUsed}</strong>
                </div>
              )}
            </div>

            {/* Attached Files */}
            {files.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Attached Files ({files.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {files.map((f, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-medium text-[11px]"
                    >
                      <Paperclip className="w-3 h-3 text-blue-600" />
                      <span>{f.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Button variant="secondary" onClick={handleBack} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => handleSubmitRegistration('DRAFT')}
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                disabled={submitting}
                onClick={() => handleSubmitRegistration('SUBMITTED')}
                icon={<Send className="w-4 h-4" />}
              >
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}

      {/* STEP 6: SUBMIT / CONFIRMATION */}
      {currentStep === 6 && (
        <Card className="text-center p-6 sm:p-10 space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Registration Successfully Received!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your project team has been logged in the exhibition system. The steering committee will review your submission and allocate your exhibition stall.
            </p>
          </div>

          {createdTeamCode && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 inline-block text-left max-w-sm mx-auto space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Official Unique Team Code
              </span>
              <div className="text-xl font-mono font-black text-blue-600 tracking-wide">
                {createdTeamCode}
              </div>
              <p className="text-[11px] text-slate-500">
                Keep this code handy for stall check-in and evaluator scoring sessions.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => router.push(`/student/teams/${createdTeamId}`)}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              View Team Dashboard
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push('/student/submissions')}
            >
              Submissions Tracker
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
