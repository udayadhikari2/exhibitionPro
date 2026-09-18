'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Settings, Layers, Users, CheckCircle2, LogOut, Trophy, BarChart3, ClipboardCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ISessionUser } from '@/types';

export default function AdminPage() {
  const [user, setUser] = useState<ISessionUser | null>(null);

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) setUser(d.user);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <PageHeader
        badge="Administrator Workspace"
        title="Admin Control Center"
        description="Protected area accessible only by SUPER_ADMIN and EVENT_ADMIN roles."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/events">
              <Button variant="primary" size="sm">
                Manage Events
              </Button>
            </Link>
            {user && (
              <Badge variant="neutral" size="md">
                Role: {user.role} ({user.status})
              </Badge>
            )}
            <Badge variant="primary" size="md">
              Server Guarded
            </Badge>
          </div>
        }
      />

      {/* Admin Identity Card */}
      {user && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">{user.name}</div>
              <div className="text-[11px] text-slate-500">{user.email} &bull; {user.institution || 'Steering Committee'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Status: {user.status}</span>
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
              <Settings className="w-4 h-4" />
            </div>
            <CardTitle>Event Lifecycle Studio</CardTitle>
            <CardDescription>
              Create and manage competitions, categories, and 10-stage lifecycle states.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Configure event dates, venues, categories, rules, and advance status through approval and publishing.
            </p>
            <Link href="/admin/events" className="block">
              <Button size="sm" variant="secondary" className="w-full">
                Open Events Manager
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <Users className="w-4 h-4" />
            </div>
            <CardTitle>Registration & Stalls</CardTitle>
            <CardDescription>
              Review team dossiers, request revisions, approve, and allocate stall numbers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Inspect student rosters, project synopses, uploaded media files, and generate stall QR codes.
            </p>
            <Link href="/admin/registration" className="block">
              <Button size="sm" variant="secondary" className="w-full">
                Registration Console
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
              <Shield className="w-4 h-4" />
            </div>
            <CardTitle>Evaluators Directory</CardTitle>
            <CardDescription>
              Create judge accounts, reset credentials, and track evaluator scoring completion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Onboard external and faculty judges with role-based isolation, active status toggles, and password management.
            </p>
            <Link href="/admin/evaluators" className="block">
              <Button size="sm" variant="secondary" className="w-full">
                Manage Evaluators
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
              <Layers className="w-4 h-4" />
            </div>
            <CardTitle>Assignment Command Center</CardTitle>
            <CardDescription>
              Pair judges with project stalls (1-to-many and many-to-1).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Project-centric and judge-centric matrix views with real-time status tracking and unassign capabilities.
            </p>
            <Link href="/admin/assignments" className="block">
              <Button size="sm" variant="secondary" className="w-full">
                Assignments Hub
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
              <Settings className="w-4 h-4" />
            </div>
            <CardTitle>Dynamic Criteria Studio</CardTitle>
            <CardDescription>
              Design custom rubrics, load presets, and compute live maximum scores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Event-wide and category-specific rules with weights, order controls, min/max mark constraints, and presets.
            </p>
            <Link href="/admin/criteria" className="block">
              <Button size="sm" variant="secondary" className="w-full">
                Criteria Studio
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-amber-200/80 bg-gradient-to-b from-amber-50/20 to-white">
          <CardHeader>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
              <Trophy className="w-4 h-4" />
            </div>
            <CardTitle>Result Management &amp; Leaderboards</CardTitle>
            <CardDescription>
              Tabulate multi-judge scores, configure tie-breakers, review dossiers, and publish.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Controlled 4-stage pipeline (Draft &rarr; Review &rarr; Approved &rarr; Published) with tie resolution.
            </p>
            <Link href="/admin/results" className="block">
              <Button size="sm" variant="primary" className="w-full bg-amber-600 hover:bg-amber-700 border-none">
                Results Console
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-1">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <CardTitle>Evaluations Matrix</CardTitle>
            <CardDescription>
              Monitor judge submissions, unlock marks, and audit submission timestamps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Live submission matrix across all assigned stalls with admin unlock and verification audits.
            </p>
            <Link href="/admin/evaluations" className="block">
              <Button size="sm" variant="secondary" className="w-full">
                Open Evaluation Matrix
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-blue-200/80 bg-gradient-to-b from-blue-50/20 to-white">
          <CardHeader>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-1">
              <BarChart3 className="w-4 h-4" />
            </div>
            <CardTitle>Reports &amp; Intelligence</CardTitle>
            <CardDescription>
              Executive KPI analytics, institutional medal standings, and official CSV exports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Download clean CSV rosters, audit evaluator marks, inspect category benchmarks, and print executive briefs.
            </p>
            <Link href="/admin/reports" className="block">
              <Button size="sm" variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 border-none">
                Open Reports Hub
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

