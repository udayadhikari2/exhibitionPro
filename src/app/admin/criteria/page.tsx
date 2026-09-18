'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Layers,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calculator,
  RefreshCw,
  Info,
  Award,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';
import { IEvaluationCriterion, IEvent, ICategory } from '@/types';

export default function CriteriaPage() {
  const { showToast } = useToast();

  const [events, setEvents] = useState<IEvent[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');

  const [criteria, setCriteria] = useState<IEvaluationCriterion[]>([]);
  const [totalMaxMarks, setTotalMaxMarks] = useState<number>(0);
  const [eventWideCount, setEventWideCount] = useState<number>(0);
  const [categorySpecificCount, setCategorySpecificCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetCategory, setTargetCategory] = useState<string>(''); // empty = Event-Wide
  const [maxMarks, setMaxMarks] = useState<number>(20);
  const [minMarks, setMinMarks] = useState<number>(0);
  const [weight, setWeight] = useState<number>(1);
  const [isRequired, setIsRequired] = useState(true);
  const [savingCriterion, setSavingCriterion] = useState(false);

  // Preset Modal State
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('Science');
  const [applyingPreset, setApplyingPreset] = useState(false);

  // Initial events fetch
  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        if (data.events?.length > 0) {
          setEvents(data.events);
          setSelectedEventId(data.events[0]._id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch categories when event changes
  useEffect(() => {
    if (!selectedEventId) return;
    fetch(`/api/events/${selectedEventId}/categories`)
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories || []);
      })
      .catch(console.error);
  }, [selectedEventId]);

  // Fetch criteria when event or category changes
  const fetchCriteria = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const url = `/api/criteria?eventId=${selectedEventId}${
        selectedCategoryId !== 'ALL' ? `&categoryId=${selectedCategoryId}` : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setCriteria(data.criteria || []);
        setTotalMaxMarks(data.totalMaxMarks || 0);
        setEventWideCount(data.eventWideCount || 0);
        setCategorySpecificCount(data.categorySpecificCount || 0);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch criteria', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, [selectedEventId, selectedCategoryId]);

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setTargetCategory(selectedCategoryId !== 'ALL' && selectedCategoryId !== 'EVENT_WIDE' ? selectedCategoryId : '');
    setMaxMarks(20);
    setMinMarks(0);
    setWeight(1);
    setIsRequired(true);
    setModalOpen(true);
  };

  const openEdit = (c: IEvaluationCriterion) => {
    setEditingId(c._id);
    setName(c.name);
    setDescription(c.description || '');
    setTargetCategory(c.categoryId || '');
    setMaxMarks(c.maxMarks);
    setMinMarks(c.minMarks ?? 0);
    setWeight(c.weight ?? 1);
    setIsRequired(c.required ?? c.isRequired ?? true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Criterion name is required', 'error');
      return;
    }
    if (Number(maxMarks) <= 0) {
      showToast('Maximum marks must be greater than 0', 'error');
      return;
    }

    setSavingCriterion(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/criteria/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            categoryId: targetCategory || null,
            maxMarks: Number(maxMarks),
            minMarks: Number(minMarks),
            weight: Number(weight),
            required: isRequired,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update criterion');
        showToast('Criterion updated', 'success');
      } else {
        const res = await fetch('/api/criteria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: selectedEventId,
            categoryId: targetCategory || null,
            name: name.trim(),
            description: description.trim(),
            maxMarks: Number(maxMarks),
            minMarks: Number(minMarks),
            weight: Number(weight),
            required: isRequired,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create criterion');
        showToast('Criterion added', 'success');
      }
      setModalOpen(false);
      fetchCriteria();
    } catch (err: any) {
      showToast(err.message || 'Save failed', 'error');
    } finally {
      setSavingCriterion(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this criterion?')) return;
    try {
      const res = await fetch(`/api/criteria/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('Criterion removed', 'success');
      fetchCriteria();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleToggleStatus = async (c: IEvaluationCriterion) => {
    const nextStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/criteria/${c._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      showToast(`Criterion set to ${nextStatus}`, 'success');
      fetchCriteria();
    } catch (err: any) {
      showToast(err.message || 'Status toggle failed', 'error');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    if ((direction === 'UP' && index === 0) || (direction === 'DOWN' && index === criteria.length - 1)) {
      return;
    }
    const newItems = [...criteria];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    setCriteria(newItems);

    try {
      const orderedIds = newItems.map((item) => item._id);
      await fetch('/api/criteria/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEventId, orderedIds }),
      });
    } catch (err) {
      console.error(err);
      fetchCriteria();
    }
  };

  const handleApplyPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyingPreset(true);
    try {
      const res = await fetch('/api/criteria/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEventId, presetKey: selectedPreset }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply preset');
      showToast(`Loaded ${data.result?.added || 'preset'} criteria`, 'success');
      setPresetModalOpen(false);
      fetchCriteria();
    } catch (err: any) {
      showToast(err.message || 'Preset loading failed', 'error');
    } finally {
      setApplyingPreset(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        badge="Evaluation Rubrics Studio"
        title="Dynamic Scoring Criteria"
        description="Configure event-wide and category-specific assessment criteria with boundary controls and dynamic total score calculations."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Sparkles className="w-4 h-4 text-purple-600" />}
              onClick={() => setPresetModalOpen(true)}
            >
              Load Rubric Preset
            </Button>
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              Add Criterion
            </Button>
          </div>
        }
      />

      {/* Filter & Live Calculation Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scope Selectors */}
        <Card className="lg:col-span-2 p-4 bg-white">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Target Exhibition / Event
              </label>
              <Select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                options={events.map((evt) => ({ value: evt._id, label: evt.name }))}
              />
            </div>

            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Rubric Scope View
              </label>
              <Select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Criteria (Event-Wide + Categories)' },
                  { value: 'EVENT_WIDE', label: 'Event-Wide Universal Criteria Only' },
                  ...categories.map((cat) => ({
                    value: cat._id,
                    label: `Category: ${cat.name}`,
                  })),
                ]}
              />
            </div>

            <div className="self-end sm:self-center pt-4 sm:pt-0">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={fetchCriteria}
              >
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {/* Live Total Marks Banner */}
        <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-100 uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5" />
              <span>Max Rubric Score</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur">
              {criteria.filter((c) => c.status !== 'INACTIVE').length} Active Rules
            </span>
          </div>

          <div className="my-2">
            <div className="text-3xl font-black tracking-tight">{totalMaxMarks} Marks</div>
            <div className="text-[11px] text-blue-100 mt-0.5">
              {eventWideCount} Event-Wide + {categorySpecificCount} Category Specific
            </div>
          </div>

          <div className="text-[10px] text-blue-200">
            Automatically normalized when evaluator scores are calculated.
          </div>
        </div>
      </div>

      {/* Criteria Table */}
      {loading ? (
        <LoadingState message="Loading scoring criteria..." />
      ) : criteria.length === 0 ? (
        <EmptyState
          icon={Sliders}
          title="No Criteria Defined"
          description="There are no evaluation criteria set for this event scope. Create criteria manually or quick-load a preset."
          action={
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPresetModalOpen(true)}>
                Load Preset
              </Button>
              <Button variant="primary" size="sm" onClick={openCreate} icon={<Plus className="w-4 h-4" />}>
                Add Criterion
              </Button>
            </div>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3 py-3.5 text-center w-12">Order</th>
                  <th className="px-4 py-3.5">Criterion Name & Scope</th>
                  <th className="px-4 py-3.5">Description</th>
                  <th className="px-4 py-3.5 text-center">Marks Range</th>
                  <th className="px-4 py-3.5 text-center">Weight</th>
                  <th className="px-4 py-3.5 text-center">Requirement</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criteria.map((c, idx) => {
                  const isEventWide = !c.categoryId;
                  return (
                    <tr
                      key={c._id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        c.status === 'INACTIVE' ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Order Controls */}
                      <td className="px-3 py-3.5 text-center">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveOrder(idx, 'UP')}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-[10px] font-bold text-slate-600">
                            {c.order || idx + 1}
                          </span>
                          <button
                            type="button"
                            disabled={idx === criteria.length - 1}
                            onClick={() => handleMoveOrder(idx, 'DOWN')}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Name & Scope */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-sm mb-1">{c.name}</div>
                        <div>
                          {isEventWide ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                              <Award className="w-2.5 h-2.5" />
                              Event-Wide
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                              <Layers className="w-2.5 h-2.5" />
                              {c.categoryName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5 text-slate-500 max-w-xs leading-relaxed">
                        {c.description || <span className="italic text-slate-400">No description provided</span>}
                      </td>

                      {/* Marks Range */}
                      <td className="px-4 py-3.5 text-center font-mono">
                        <span className="inline-block bg-slate-100 text-slate-800 font-bold px-2 py-1 rounded text-xs">
                          {c.minMarks ?? 0} &mdash; {c.maxMarks}
                        </span>
                      </td>

                      {/* Weight */}
                      <td className="px-4 py-3.5 text-center font-mono text-slate-700 font-semibold">
                        {c.weight || 1}x
                      </td>

                      {/* Requirement */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            c.required ?? c.isRequired ?? true
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {c.required ?? c.isRequired ?? true ? 'Mandatory' : 'Optional'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                          title="Click to toggle status"
                        >
                          {c.status || 'ACTIVE'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEdit(c)}
                            icon={<Edit className="w-3.5 h-3.5" />}
                          >
                            Edit
                          </Button>
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete criterion"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Criterion Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Scoring Criterion' : 'Create New Scoring Criterion'}
        description="Configure evaluation parameter parameters and category scope."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Criterion Name *</label>
            <Input
              required
              placeholder="e.g. Technical Feasibility & Working Prototype"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Evaluation Scope *</label>
            <Select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              options={[
                { value: '', label: 'Universal (Applies to all projects in this event)' },
                ...categories.map((cat) => ({
                  value: cat._id,
                  label: `Category Specific: ${cat.name}`,
                })),
              ]}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Leave as Universal to apply across all categories, or restrict to a specialized discipline.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description & Rubric Guidelines</label>
            <Textarea
              placeholder="Provide clear scoring instructions for evaluators..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Max Marks *</label>
              <Input
                type="number"
                required
                min={1}
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Min Marks</label>
              <Input
                type="number"
                min={0}
                value={minMarks}
                onChange={(e) => setMinMarks(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Weight Factor</label>
              <Input
                type="number"
                step="0.1"
                min={0.1}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isRequired"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isRequired" className="text-xs font-bold text-slate-700 cursor-pointer">
              Mandatory Scoring Field (Evaluator cannot submit evaluation without filling this)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={savingCriterion}>
              {savingCriterion ? 'Saving...' : editingId ? 'Update Criterion' : 'Create Criterion'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preset Rubric Modal */}
      <Modal
        isOpen={presetModalOpen}
        onClose={() => setPresetModalOpen(false)}
        title="Load Standard Rubric Preset"
        description="Select a battle-tested evaluation rubric template to auto-populate your event criteria."
      >
        <form onSubmit={handleApplyPreset} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Preset Template</label>
            <Select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              options={[
                { value: 'Science', label: 'Science Fair Rubric (Innovation, Methodology, Prototype, Demo, Q&A - 100 Marks)' },
                { value: 'IT', label: 'IT & Software Hackathon (Code Quality, UX, Innovation, Scalability - 100 Marks)' },
                { value: 'Robotics', label: 'Robotics Challenge (Mechanical, Circuitry, Autonomy, Task Speed - 100 Marks)' },
                { value: 'Cultural', label: 'Cultural & Arts Performance (Technique, Expression, Theme, Impact - 100 Marks)' },
              ]}
            />
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
            <div className="font-bold">Preset Preview:</div>
            <p className="text-blue-700">
              This will append the standardized parameters for {selectedPreset} exhibitions to this event.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setPresetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={applyingPreset}>
              {applyingPreset ? 'Loading...' : 'Apply Preset'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
