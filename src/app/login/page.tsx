'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Shield,
  Smartphone,
  GraduationCap,
  Calendar,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(() => {
    if (errorParam === 'unauthorized') return 'You are not authorized to access that workspace.';
    if (errorParam === 'inactive') return 'This account has been deactivated. Please contact support.';
    return '';
  });

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail || !loginPass) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      // Route based on redirect param or user role
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (data.user.role === 'SUPER_ADMIN' || data.user.role === 'EVENT_ADMIN') {
        router.push('/admin');
      } else if (data.user.role === 'EVALUATOR') {
        router.push('/evaluator');
      } else {
        router.push('/student');
      }
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    {
      role: 'SUPER_ADMIN',
      badge: 'Super Admin',
      badgeVariant: 'neutral' as const,
      name: 'Super Administrator',
      email: 'admin.exhibition.com',
      pass: 'exhibition@123',
      icon: Shield,
    },
    {
      role: 'EVENT_ADMIN',
      badge: 'Event Admin',
      badgeVariant: 'primary' as const,
      name: 'Prof. David Reynolds',
      email: 'eventadmin@portal.edu',
      pass: 'event123',
      icon: Calendar,
    },
    {
      role: 'EVALUATOR',
      badge: 'Evaluator',
      badgeVariant: 'success' as const,
      name: 'Dr. Elena Rostova',
      email: 'elena@evaluator.edu',
      pass: 'eval123',
      icon: Smartphone,
    },
    {
      role: 'STUDENT',
      badge: 'Student Lead',
      badgeVariant: 'warning' as const,
      name: 'Alex Chen',
      email: 'alex@student.edu',
      pass: 'student123',
      icon: GraduationCap,
    },
  ];

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-16 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
          <Trophy className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Sign In to Portal
        </h1>
        <p className="text-xs text-slate-500">
          Enter your institutional credentials to access your workspace.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Login Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Credentials</CardTitle>
          <CardDescription>
            Session cookies are securely encrypted and verified server-side.
          </CardDescription>
        </CardHeader>

        <form onSubmit={(e) => handleLogin(e)}>
          <CardContent className="space-y-4">
            <Input
              type="text"
              label="Username or Institutional Email"
              placeholder="admin.exhibition.com or user@portal.edu"
              required
              autoCapitalize="none"
              autoCorrect="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="w-full"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Demo Personas for Quick Role Verification */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Instant Role Testing Personas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {demoAccounts.map((acc) => {
            const Icon = acc.icon;
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleLogin(undefined, acc.email, acc.pass)}
                disabled={loading}
                className="text-left p-2.5 bg-white hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-all shadow-2xs space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={acc.badgeVariant} size="sm">
                    {acc.badge}
                  </Badge>
                  <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition" />
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">{acc.name}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{acc.email}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
          &larr; Back to Public Portal
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-xs text-slate-400">Loading sign in...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
