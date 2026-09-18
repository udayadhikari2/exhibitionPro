'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Search,
  Plus,
  KeyRound,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Phone,
  Mail,
  Building,
  SlidersHorizontal,
  RefreshCw,
  Award,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';
import { IEvaluatorWithStats, IEvent } from '@/types';

export default function EvaluatorsPage() {
  const { showToast } = useToast();

  const [evaluators, setEvaluators] = useState<IEvaluatorWithStats[]>([]);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [eventFilter, setEventFilter] = useState('ALL');

  // Add Evaluator Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newPassword, setNewPassword] = useState('eval123');
  const [isCreating, setIsCreating] = useState(false);

  // Reset Password Modal
  const [resetTarget, setResetTarget] = useState<IEvaluatorWithStats | null>(null);
  const [resetNewPass, setResetNewPass] = useState('eval123');
  const [isResetting, setIsResetting] = useState(false);

  const fetchData = async () => {
    try {
      const [evalRes, evtRes] = await Promise.all([
        fetch(
          `/api/evaluators?search=${encodeURIComponent(search)}&status=${statusFilter}${
            eventFilter !== 'ALL' ? `&eventId=${eventFilter}` : ''
          }`
        ),
        fetch('/api/events'),
      ]);

      const evalData = await evalRes.json();
      const evtData = await evtRes.json();

      if (evalRes.ok) setEvaluators(evalData.evaluators || []);
      if (evtRes.ok) setEvents(evtData.events || []);
    } catch (err: any) {
      showToast(err.message || 'Error loading evaluators', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, eventFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCreateEvaluator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/evaluators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim(),
          institution: newInstitution.trim(),
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create evaluator');

      showToast(`Evaluator "${data.evaluator.name}" registered successfully`, 'success');
      setIsAddOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewInstitution('');
      setNewPassword('eval123');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Creation failed', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (evaluator: IEvaluatorWithStats) => {
    const nextStatus = evaluator.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/evaluators/${evaluator._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      showToast(`Evaluator status updated to ${nextStatus}`, 'success');
      setEvaluators((prev) =>
        prev.map((e) => (e._id === evaluator._id ? { ...e, status: nextStatus } : e))
      );
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;

    setIsResetting(true);
    try {
      const res = await fetch(`/api/evaluators/${resetTarget._id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetNewPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      showToast(`Password reset successfully for ${resetTarget.name}`, 'success');
      setResetTarget(null);
      setResetNewPass('eval123');
    } catch (err: any) {
      showToast(err.message || 'Password reset failed', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const totalAssigned = evaluators.reduce((acc, curr) => acc + curr.assignedCount, 0);
  const totalCompleted = evaluators.reduce((acc, curr) => acc + curr.completedCount, 0);
  const activeEvaluators = evaluators.filter((e) => e.status === 'ACTIVE').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <PageHeader
        badge="Evaluator & Jury Management"
        title="Evaluators Directory"
        description="Manage judges, create evaluator accounts, allocate project scoring quotas, and manage credentials."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/assignments">
              <Button variant="secondary" size="sm" icon={<Award className="w-4 h-4" />}>
                Assignments Hub
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddOpen(true)}
            >
              Add Evaluator
            </Button>
          </div>
        }
      />

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Evaluators</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{evaluators.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">{activeEvaluators} Active</div>
        </Card>
        <Card className="p-4 bg-white">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Assignments</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{totalAssigned}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all events</div>
        </Card>
        <Card className="p-4 bg-white">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Evaluations Complete</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{totalCompleted}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            {totalAssigned > 0 ? `${Math.round((totalCompleted / totalAssigned) * 100)}% completion` : '0%'}
          </div>
        </Card>
        <Card className="p-4 bg-white">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Reviews</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{totalAssigned - totalCompleted}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Awaiting scoring</div>
        </Card>
      </div>

      {/* Search & Filters Bar */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by judge name, email, phone, or university..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-36">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Active Only' },
                  { value: 'INACTIVE', label: 'Inactive Only' },
                ]}
              />
            </div>
            <div className="w-48">
              <Select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Events Scope' },
                  ...events.map((evt) => ({ value: evt._id, label: evt.name })),
                ]}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={fetchData} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Evaluators Table */}
      {loading ? (
        <LoadingState message="Loading evaluators directory..." />
      ) : evaluators.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No Evaluators Found"
          description="There are no evaluators matching the current filters. Add new judges to begin assignings."
          action={
            <Button variant="primary" onClick={() => setIsAddOpen(true)} icon={<Plus className="w-4 h-4" />}>
              Add First Evaluator
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Evaluator</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Affiliation</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Assignment Load</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evaluators.map((ev) => (
                  <tr key={ev._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {ev.name.charAt(0)}
                        </div>
                        <div>
                          <Link
                            href={`/admin/evaluators/${ev._id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                          >
                            {ev.name}
                          </Link>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {ev._id.slice(-6)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-800 font-medium flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{ev.email}</span>
                      </div>
                      {ev.phone && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{ev.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {ev.institution ? (
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{ev.institution}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Independent / Faculty</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={ev.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {ev.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{ev.assignedCount}</span>
                          <span className="text-slate-400">assigned</span>
                          {ev.assignedCount > 0 && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                              {ev.completedCount} done
                            </span>
                          )}
                        </div>
                        {ev.assignedCount > 0 && (
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{
                                width: `${(ev.completedCount / ev.assignedCount) * 100}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/evaluators/${ev._id}`}>
                          <Button size="sm" variant="secondary" icon={<Eye className="w-3.5 h-3.5" />}>
                            Profile
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setResetTarget(ev)}
                          title="Reset Password"
                          icon={<KeyRound className="w-3.5 h-3.5 text-slate-600" />}
                        />
                        <Button
                          size="sm"
                          variant={ev.status === 'ACTIVE' ? 'danger' : 'secondary'}
                          onClick={() => handleToggleStatus(ev)}
                          title={ev.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        >
                          {ev.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Evaluator Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Evaluator"
        description="Create an evaluation judge profile. Credentials will grant immediate access to scoring assigned stalls."
      >
        <form onSubmit={handleCreateEvaluator} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <Input
              required
              placeholder="e.g. Dr. Eleanor Vance"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <Input
              type="email"
              required
              placeholder="e.g. evance@university.edu"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <Input
                placeholder="+1 555-019-2831"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Institution / Dept</label>
              <Input
                placeholder="e.g. Robotics Lab"
                value={newInstitution}
                onChange={(e) => setNewInstitution(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
            <Input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p className="text-[11px] text-slate-400 mt-1">Default is set to eval123. The judge can log in immediately.</p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isCreating}>
              {isCreating ? 'Registering...' : 'Register Evaluator'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title={`Reset Password: ${resetTarget?.name}`}
        description="Set a new secure password for this evaluator account."
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password *</label>
            <Input
              type="text"
              required
              value={resetNewPass}
              onChange={(e) => setResetNewPass(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isResetting}>
              {isResetting ? 'Saving...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
