import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { leadsAPI, type Lead } from '@/api/leads';
import { faqAPI, type Faq } from '@/api/faq';
import Button from '@/components/shared/Button';

export const LeadsList: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal for converting Lead question to FAQ
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqParentId, setFaqParentId] = useState<number | null>(null);
  const [faqSortOrder, setFaqSortOrder] = useState<number>(0);
  const [parentOptions, setParentOptions] = useState<Faq[]>([]);
  const [submittingFaq, setSubmittingFaq] = useState(false);
  const [faqModalError, setFaqModalError] = useState<string | null>(null);

  // Notes Modal / editing notes
  const [editingNotesLead, setEditingNotesLead] = useState<Lead | null>(null);
  const [leadNotes, setLeadNotes] = useState('');

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await leadsAPI.getLeads({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setLeads(data);
    } catch (err: any) {
      console.error('Failed to load leads:', err);
      setError(err?.message || 'Не удалось загрузить лидов');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  const loadParentOptions = async () => {
    try {
      const data = await faqAPI.getFaqs({ flat: true });
      setParentOptions(data);
    } catch (e) {
      console.error('Failed to load FAQ parent options:', e);
    }
  };

  useEffect(() => {
    loadLeads();
    loadParentOptions();
  }, [loadLeads]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { all: leads.length, new: 0, in_progress: 0, contacted: 0, closed: 0 };
    leads.forEach(l => {
      if (counts[l.status] !== undefined) {
        counts[l.status]++;
      }
    });
    return counts;
  }, [leads]);

  // Handle status update
  const handleStatusChange = async (leadId: number, newStatus: string) => {
    try {
      await leadsAPI.updateStatus(leadId, newStatus);
      setLeads(prev =>
        prev.map(l => (l.id === leadId ? { ...l, status: newStatus as any } : l))
      );
    } catch (err: any) {
      alert(err?.message || 'Ошибка обновления статуса');
    }
  };

  // Open modal to add lead to FAQ
  const openAddToFaqModal = (lead: Lead) => {
    setSelectedLead(lead);
    setFaqAnswer('');
    setFaqParentId(null);
    setFaqSortOrder(0);
    setFaqModalError(null);
    setIsFaqModalOpen(true);
  };

  // Submit adding lead question to FAQ
  const handleSaveToFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    if (!faqAnswer.trim()) {
      setFaqModalError('Пожалуйста, напишите ответ для добавления в FAQ');
      return;
    }

    try {
      setSubmittingFaq(true);
      setFaqModalError(null);

      // Create FAQ item directly and link to lead
      await leadsAPI.convertFaq(selectedLead.id, {
        answer: faqAnswer.trim(),
        parent_id: faqParentId,
        sort_order: faqSortOrder,
      });

      setIsFaqModalOpen(false);
      await loadLeads();
      alert('Вопрос успешно добавлен в базу знаний FAQ!');
    } catch (err: any) {
      setFaqModalError(err?.message || 'Ошибка добавления в FAQ');
    } finally {
      setSubmittingFaq(false);
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!editingNotesLead) return;
    try {
      await leadsAPI.updateStatus(editingNotesLead.id, editingNotesLead.status, leadNotes);
      setLeads(prev =>
        prev.map(l => (l.id === editingNotesLead.id ? { ...l, notes: leadNotes } : l))
      );
      setEditingNotesLead(null);
    } catch (err: any) {
      alert(err?.message || 'Ошибка сохранения заметки');
    }
  };

  // Delete lead
  const handleDelete = async (lead: Lead) => {
    if (!window.confirm(`Удалить обращение от ${lead.phone}?`)) return;
    try {
      await leadsAPI.deleteLead(lead.id);
      setLeads(prev => prev.filter(l => l.id !== lead.id));
    } catch (err: any) {
      alert(err?.message || 'Ошибка удаления');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contacted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h1 className="text-2xl font-bold text-gray-900">Управление лидами</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Заявки и пользовательские вопросы, поступившие через онлайн-помощник и формы сайта
          </p>
        </div>

        <Button onClick={loadLeads} variant="secondary">
          🔄 Обновить список
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status filter tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: '', label: 'Все', count: statusCounts.all },
            { id: 'new', label: 'Новые', count: statusCounts.new },
            { id: 'in_progress', label: 'В обработке', count: statusCounts.in_progress },
            { id: 'contacted', label: 'Связались', count: statusCounts.contacted },
            { id: 'closed', label: 'Закрыты', count: statusCounts.closed },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по телефону, email, вопросу..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Загрузка лидов...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-700 text-center">
          <p className="font-semibold">{error}</p>
          <Button onClick={loadLeads} variant="primary" className="mt-3">
            Повторить
          </Button>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <span className="text-4xl block mb-2">🎯</span>
          <h3 className="text-lg font-semibold text-gray-800">Лидов не найдено</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            {search || statusFilter
              ? 'По заданным фильтрам ничего не найдено.'
              : 'Пока нет входящих обращений. Как только посетители зададут вопрос в чате, они появятся здесь.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Дата</th>
                  <th className="px-4 py-3.5">Контакты</th>
                  <th className="px-4 py-3.5">Вопрос пользователя</th>
                  <th className="px-4 py-3.5 text-center">Статус заявки</th>
                  <th className="px-4 py-3.5 text-center">База знаний (FAQ)</th>
                  <th className="px-4 py-3.5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50/70 transition">
                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      <div>{new Date(lead.created_at).toLocaleDateString('ru-RU')}</div>
                      <div className="text-gray-400 font-mono text-[11px]">
                        {new Date(lead.created_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Contacts */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        <a
                          href={`tel:${lead.phone}`}
                          className="hover:text-blue-600 transition flex items-center gap-1"
                        >
                          <span>📞</span>
                          <span>{lead.phone}</span>
                        </a>
                      </div>
                      {lead.email && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          <a
                            href={`mailto:${lead.email}`}
                            className="hover:underline flex items-center gap-1"
                          >
                            <span>✉️</span>
                            <span>{lead.email}</span>
                          </a>
                        </div>
                      )}
                      {lead.name && (
                        <div className="text-xs text-gray-400 mt-0.5">Имя: {lead.name}</div>
                      )}
                    </td>

                    {/* Question */}
                    <td className="px-4 py-3 max-w-sm">
                      <div className="text-sm font-medium text-gray-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 leading-relaxed">
                        {lead.question}
                      </div>
                      {lead.notes && (
                        <div className="mt-1.5 text-xs text-gray-500 italic flex items-center gap-1">
                          <span>📝 Заметка:</span>
                          <span>{lead.notes}</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <select
                        value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusBadgeClass(
                          lead.status
                        )}`}
                      >
                        <option value="new">🟡 Новый</option>
                        <option value="in_progress">🔵 В обработке</option>
                        <option value="contacted">🟣 Связались</option>
                        <option value="closed">🟢 Закрыт</option>
                      </select>
                    </td>

                    {/* FAQ Status */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {lead.is_faq_added ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <span>✓</span>
                          <span>В базе FAQ</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openAddToFaqModal(lead)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition flex items-center gap-1 mx-auto cursor-pointer"
                          title="Добавить этот вопрос в официальный FAQ"
                        >
                          <span>+</span>
                          <span>Добавить в FAQ</span>
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNotesLead(lead);
                            setLeadNotes(lead.notes || '');
                          }}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded cursor-pointer"
                          title="Добавить заметку менеджера"
                        >
                          📝
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(lead)}
                          className="px-2 py-1 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 rounded cursor-pointer"
                          title="Удалить лид"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add to FAQ */}
      {isFaqModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>💬</span>
                <span>Добавить вопрос в базу знаний FAQ</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFaqModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveToFaq} className="p-6 space-y-4">
              {faqModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                  {faqModalError}
                </div>
              )}

              {/* Question (from lead) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Вопрос пользователя (будет опубликован в FAQ)
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-semibold text-gray-900">
                  {selectedLead.question}
                </div>
              </div>

              {/* Parent Branch */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Родительская ветка (Куда прикрепить)
                </label>
                <select
                  value={faqParentId === null ? '' : faqParentId}
                  onChange={e =>
                    setFaqParentId(e.target.value === '' ? null : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">🏠 Корневой вопрос (Главная ветка)</option>
                  {parentOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.parent_id ? `  ↳ ${opt.question}` : opt.question}
                    </option>
                  ))}
                </select>
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Ответ помощника <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={faqAnswer}
                  onChange={e => setFaqAnswer(e.target.value)}
                  placeholder="Напишите понятный и подробный ответ для посетителей сайта..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Order */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Порядковый номер (сортировка)
                </label>
                <input
                  type="number"
                  value={faqSortOrder}
                  onChange={e => setFaqSortOrder(Number(e.target.value) || 0)}
                  className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsFaqModalOpen(false)}
                  disabled={submittingFaq}
                >
                  Отмена
                </Button>
                <Button type="submit" variant="primary" disabled={submittingFaq}>
                  {submittingFaq ? 'Сохранение...' : 'Опубликовать в FAQ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Notes */}
      {editingNotesLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Заметка по обращению</h3>
            <p className="text-xs text-gray-500">
              Контакты: {editingNotesLead.phone} ({editingNotesLead.email || 'без email'})
            </p>
            <textarea
              rows={3}
              value={leadNotes}
              onChange={e => setLeadNotes(e.target.value)}
              placeholder="Комментарий менеджера (например: перезвонил, договорились на пятницу)..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditingNotesLead(null)}>
                Отмена
              </Button>
              <Button type="button" variant="primary" onClick={handleSaveNotes}>
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsList;
