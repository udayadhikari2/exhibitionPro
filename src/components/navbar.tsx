'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Trophy,
  Menu,
  X,
  Shield,
  Smartphone,
  GraduationCap,
  LogIn,
  LogOut,
  User as UserIcon,
  BarChart3,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ISessionUser, UserRole } from '@/types';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<ISessionUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'neutral';
      case 'EVENT_ADMIN':
        return 'primary';
      case 'EVALUATOR':
        return 'success';
      case 'STUDENT':
        return 'warning';
      default:
        return 'default';
    }
  };

  const navLinks = [
    { href: '/', label: 'Overview', visible: true },
    { href: '/events', label: 'Events', visible: true },
    { href: '/admin/events', label: 'Manage Events', icon: Shield, visible: !user || user.role === 'SUPER_ADMIN' || user.role === 'EVENT_ADMIN' },
    { href: '/admin/results', label: 'Results', icon: Trophy, visible: !user || user.role === 'SUPER_ADMIN' || user.role === 'EVENT_ADMIN' },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3, visible: !user || user.role === 'SUPER_ADMIN' || user.role === 'EVENT_ADMIN' },
    { href: '/admin', label: 'Admin Hub', icon: Shield, visible: !user || user.role === 'SUPER_ADMIN' || user.role === 'EVENT_ADMIN' },
    { href: '/evaluator', label: 'Evaluator', icon: Smartphone, visible: !user || user.role === 'EVALUATOR' || user.role === 'SUPER_ADMIN' },
    { href: '/student', label: 'Student', icon: GraduationCap, visible: !user || user.role === 'STUDENT' || user.role === 'SUPER_ADMIN' },
  ].filter((l) => l.visible);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900 tracking-tight text-base">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900">ExhibPortal</span>
              <Badge variant="primary" size="sm">Ready</Badge>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-xl transition ${
                    isActive
                      ? 'text-blue-700 bg-blue-50 font-bold'
                      : 'hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth State Action */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  isLoading={isLoggingOut}
                  title="Sign out"
                  className="text-slate-400 hover:text-rose-600 p-2"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm">
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-2">
            {user && (
              <div className="px-3 py-2 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{user.name}</div>
                  <div className="text-[10px] text-slate-500">{user.email}</div>
                </div>
                <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                  {user.role}
                </Badge>
              </div>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-xs font-semibold ${
                  pathname === link.href
                    ? 'text-blue-700 bg-blue-50 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-2 border-t border-slate-100">
              {user ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  <span>Sign Out</span>
                </Button>
              ) : (
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
