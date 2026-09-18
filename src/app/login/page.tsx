'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  ArrowRight,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMessage('Please enter your username/email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
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

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-20 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
          <Trophy className="w-6 h-6" />
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

        <form onSubmit={handleLogin}>
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
