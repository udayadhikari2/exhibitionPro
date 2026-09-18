import Link from 'next/link';
import { Trophy, Shield, Smartphone, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="primary" size="md">
          Phase 2 &mdash; Event &amp; Category Management
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Digital Exhibition &amp; Competition Portal
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          A clean, fast, and event-driven platform designed to digitize school and college exhibitions
          and competitions &mdash; from student team registrations through evaluator assessments and published results.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link href="/events">
            <Button variant="primary" size="md">
              <span>Browse Events</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/admin/events">
            <Button variant="outline" size="md">
              Manage Events
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="md">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Role Workspaces Preview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverable className="p-1">
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Shield className="w-5 h-5" />
            </div>
            <CardTitle>Admin Studio</CardTitle>
            <CardDescription>
              Configure events, categories, and dynamic evaluation criteria rubrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>11-stage validated event lifecycle</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Configurable rubric criteria &amp; weights</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Evaluator assignment &amp; stall allocator</span>
              </li>
            </ul>
            <Link href="/admin" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                Open Admin Placeholder
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card hoverable className="p-1">
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <Smartphone className="w-5 h-5" />
            </div>
            <CardTitle>Mobile Evaluator</CardTitle>
            <CardDescription>
              Mobile-first walk-around interface for judges scoring projects live on the floor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Touch-friendly dynamic rubric steppers</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Strict privacy: blind to other judges</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Immediate score locking &amp; audit logging</span>
              </li>
            </ul>
            <Link href="/evaluator" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                Open Evaluator Placeholder
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card hoverable className="p-1">
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <GraduationCap className="w-5 h-5" />
            </div>
            <CardTitle>Student &amp; Team</CardTitle>
            <CardDescription>
              Team registration, abstract submission, correction review, and stall passes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Multi-member roster submission</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Stall QR pass for visitor feedback</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Real-time submission status tracking</span>
              </li>
            </ul>
            <Link href="/student" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full">
                Open Student Placeholder
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
