import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { faqAPI, type Faq, type FaqFormData } from '@/api/faq';
import Button from '@/components/shared/Button';

export const FaqList: React.FC = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [parentSelectOptions, setParentSelectOptions] = useState<Faq[]>([]);
  const [modalForm, setModalForm] = useState<FaqFormData>({
    question: '',
    answer: '',
    parent_id: null,
    sort_order: 0,
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Load FAQs
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await faqAPI.getFaqs({ flat: false });
      setFaqs(data);

      // Also pre-expand root nodes initially
      const initialExpanded: Record<number, boolean> = {};
      data.forEach(item => {
        if (!item.parent_id) {
          initialExpanded[item.id] = true;
        }
      });
      setExpandedNodes(prev => ({ ...initialExpanded, ...prev }));
    } catch (err: any) {
      console.error('Failed to load FAQs:', err);
      setError(err?.message || 'Не удалось загрузить вопросы');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load flat options for parent selector
  const loadParentOptions = async () => {
    try {
      const all = await faqAPI.getFaqs({ flat: true });
      setParentSelectOptions(all);
    } catch (e) {
      console.error('Failed to load parent options:', e);
    }
  };

  useEffect(() => {
    loadData();
    loadParentOptions();
  }, [loadData]);

  // Toggle node collapse/expand
  const toggleExpand = (id: number) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allIds: Record<number, boolean> = {};
    const traverse = (items: Faq[]) => {
      items.forEach(item => {
        allIds[item.id] = true;
        if (item.children) traverse(item.children);
      });
    };
    traverse(faqs);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // Open Create Modal (optionally for specific parent)
  const openCreateModal = (parentId: number | null = null) => {
    setEditingFaq(null);
    setModalForm({
      question: '',
      answer: '',
      parent_id: parentId,
      sort_order: 0,
      is_active: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (faq: Faq) => {
    setEditingFaq(faq);
    setModalForm({
      question: faq.question,
      answer: faq.answer,
      parent_id: faq.parent_id,
      sort_order: faq.sort_order,
      is_active: faq.is_active,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.question.trim()) {
      setModalError('Пожалуйста, введите вопрос');
      return;
    }
    if (!modalForm.answer.trim()) {
      setModalError('Пожалуйста, введите ответ');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);

      if (editingFaq) {
        await faqAPI.updateFaq(editingFaq.id, modalForm);
      } else {
        await faqAPI.createFaq(modalForm);
      }

      setIsModalOpen(false);
      await loadData();
      await loadParentOptions();
    } catch (err: any) {
      console.error('Error saving FAQ:', err);
      setModalError(err?.message || 'Ошибка сохранения');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active status
  const handleToggleStatus = async (faq: Faq) => {
    try {
      await faqAPI.toggleStatus(faq.id);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Ошибка смены статуса');
    }
  };

  // Delete FAQ
  const handleDelete = async (faq: Faq) => {
    const hasChildren = (faq.children_count ?? 0) > 0 || (faq.children && faq.children.length > 0);
    const confirmMsg = hasChildren
      ? `Вопрос "${faq.question}" содержит дочерние подвопросы, которые также будут удалены. Вы уверены?`
      : `Удалить вопрос "${faq.question}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await faqAPI.deleteFaq(faq.id);
      await loadData();
      await loadParentOptions();
    } catch (err: any) {
      alert(err?.message || 'Ошибка удаления');
    }
  };

  // Build tree from flat items
  const treeData = useMemo(() => {
    const idMap: Record<number, Faq & { children: Faq[] }> = {};
    const roots: (Faq & { children: Faq[] })[] = [];

    // First clone items
    faqs.forEach(f => {
      idMap[f.id] = { ...f, children: [] };
    });

    // Populate children
    faqs.forEach(f => {
      const node = idMap[f.id];
      if (f.parent_id && idMap[f.parent_id]) {
        idMap[f.parent_id].children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by sort_order
    const sortNodes = (nodes: (Faq & { children: Faq[] })[]) => {
      nodes.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
      nodes.forEach(n => sortNodes(n.children as any));
    };
    sortNodes(roots);

    return roots;
  }, [faqs]);

  // Filtered items based on search
  const filteredTree = useMemo(() => {
    if (!search.trim()) return treeData;
    const q = search.toLowerCase();

    const filterNode = (node: Faq & { children: Faq[] }): (Faq & { children: Faq[] }) | null => {
      const matches =
        node.question.toLowerCase().includes(q) || node.answer.toLowerCase().includes(q);

      const matchingChildren = node.children
        .map(child => filterNode(child as any))
        .filter(Boolean) as (Faq & { children: Faq[] })[];

      if (matches || matchingChildren.length > 0) {
        return {
          ...node,
          children: matchingChildren,
        };
      }
      return null;
    };

    return treeData.map(filterNode).filter(Boolean) as (Faq & { children: Faq[] })[];
  }, [treeData, search]);

  // Flat list filtered for table view
  const filteredFlatList = useMemo(() => {
    if (!search.trim()) return faqs;
    const q = search.toLowerCase();
    return faqs.filter(
      f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }, [faqs, search]);

  // Render a tree node recursively
  const renderTreeNode = (node: Faq & { children: Faq[] }, level: number = 0) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isRoot = level === 0;

    return (
      <div key={node.id} className="relative transition-all">
        {/* Node card */}
        <div
          className={`group flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 mb-2.5 ${
            isRoot
              ? 'bg-white shadow-sm border-gray-200 hover:border-blue-300 hover:shadow-md'
              : 'bg-slate-50/70 border-slate-200/90 hover:bg-white hover:border-blue-200 hover:shadow-sm'
          } ${!node.is_active ? 'opacity-70 border-dashed' : ''}`}
          style={{ marginLeft: `${level * 28}px` }}
        >
          {/* Connector tree glyph for child levels */}
          {!isRoot && (
            <div className="absolute -left-4 top-6 text-gray-300 font-mono text-sm select-none">
              ↳
            </div>
          )}

          {/* Expand / Collapse Button */}
          <button
            type="button"
            onClick={() => toggleExpand(node.id)}
            className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              hasChildren
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-default'
            }`}
            title={hasChildren ? (isExpanded ? 'Свернуть ветку' : 'Развернуть ветку') : 'Нет подвопросов'}
          >
            {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
          </button>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-md ${
                  isRoot
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-sky-100 text-sky-800 border border-sky-200'
                }`}
              >
                {isRoot ? 'Корневой вопрос' : `Ветка ур. ${level}`}
              </span>

              <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600">
                Порядок: {node.sort_order}
              </span>

              <button
                type="button"
                onClick={() => handleToggleStatus(node)}
                className={`px-2 py-0.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                  node.is_active
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                }`}
                title="Нажмите чтобы изменить статус видимости"
              >
                {node.is_active ? '● Активен' : '○ Скрыт'}
              </button>

              {hasChildren && (
                <span className="text-xs text-gray-500 font-medium">
                  {node.children.length} {node.children.length === 1 ? 'подвопрос' : 'подвопросов'}
                </span>
              )}
            </div>

            <h4 className="text-base font-semibold text-gray-900 leading-snug">
              {node.question}
            </h4>

            {/* Answer excerpt */}
            <div className="mt-2 text-sm text-gray-600 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 leading-relaxed">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
                Ответ помощника:
              </span>
              <p className="whitespace-pre-wrap">{node.answer}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
            <button
              type="button"
              onClick={() => openCreateModal(node.id)}
              className="p-1.5 px-2.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
              title="Добавить подвопрос к этой ветке"
            >
              <span>+</span>
              <span>Подвопрос</span>
            </button>

            <button
              type="button"
              onClick={() => openEditModal(node)}
              className="p-1.5 px-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              title="Редактировать вопрос и ответ"
            >
              ✏️
            </button>

            <button
              type="button"
              onClick={() => handleDelete(node)}
              className="p-1.5 px-2 rounded-lg text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Удалить вопрос"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Child branches if expanded */}
        {hasChildren && isExpanded && (
          <div className="ml-2 pl-3 border-l-2 border-blue-200/60 my-1 space-y-2">
            {node.children.map(child => renderTreeNode(child as any, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <h1 className="text-2xl font-bold text-gray-900">Вопросы и ответы (FAQ)</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Управление иерархическим деревом вопросов и ответов для онлайн-помощника на сайте
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={() => openCreateModal(null)} variant="primary">
            + Создать вопрос
          </Button>
        </div>
      </div>

      {/* Control bar: search, view switcher, expand/collapse */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по вопросам и ответам..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {viewMode === 'tree' && (
            <>
              <button
                type="button"
                onClick={expandAll}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
              >
                Развернуть все
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
              >
                Свернуть все
              </button>
            </>
          )}

          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                viewMode === 'tree' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🌿 Дерево веток
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Таблица
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Загрузка вопросов...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-700 text-center">
          <p className="font-semibold">{error}</p>
          <Button onClick={loadData} variant="primary" className="mt-3">
            Повторить
          </Button>
        </div>
      ) : filteredTree.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <span className="text-4xl block mb-2">💬</span>
          <h3 className="text-lg font-semibold text-gray-800">Вопросов пока нет</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            {search ? 'По вашему запросу ничего не найдено.' : 'Создайте первый вопрос, чтобы посетители сайта могли получать полезные ответы.'}
          </p>
          <Button onClick={() => openCreateModal(null)} variant="primary" className="mt-4">
            + Создать вопрос
          </Button>
        </div>
      ) : viewMode === 'tree' ? (
        <div className="space-y-3">
          {filteredTree.map(rootNode => renderTreeNode(rootNode, 0))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">ID</th>
                  <th className="px-4 py-3.5">Вопрос</th>
                  <th className="px-4 py-3.5">Родительская ветка</th>
                  <th className="px-4 py-3.5">Ответ помощника</th>
                  <th className="px-4 py-3.5 text-center">Порядок</th>
                  <th className="px-4 py-3.5 text-center">Статус</th>
                  <th className="px-4 py-3.5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredFlatList.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{item.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 max-w-xs">
                      {item.question}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {item.parent ? (
                        <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          ↳ {item.parent.question}
                        </span>
                      ) : (
                        <span className="text-blue-600 font-medium">Корневой вопрос</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-md truncate">
                      {item.answer}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 text-xs font-mono">
                      {item.sort_order}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer ${
                          item.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.is_active ? 'Активен' : 'Скрыт'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openCreateModal(item.id)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
                          title="Добавить подвопрос"
                        >
                          + ветка
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded"
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="px-2 py-1 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 rounded"
                          title="Удалить"
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

      {/* Modal Dialog for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">
                {editingFaq ? 'Редактировать вопрос' : 'Новый вопрос FAQ'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                  {modalError}
                </div>
              )}

              {/* Parent Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Родительская ветка (Вопрос вышестоящего уровня)
                </label>
                <select
                  value={modalForm.parent_id === null ? '' : modalForm.parent_id}
                  onChange={e =>
                    setModalForm(prev => ({
                      ...prev,
                      parent_id: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">🏠 Корневой вопрос (Главная ветка)</option>
                  {parentSelectOptions
                    .filter(opt => !editingFaq || opt.id !== editingFaq.id)
                    .map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.parent_id ? `  ↳ ${opt.question}` : opt.question}
                      </option>
                    ))}
                </select>
                <span className="text-xs text-gray-400 mt-1 block">
                  Если выбрать «Корневой вопрос», он будет отображаться на стартовом экране виджета.
                </span>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Текст вопроса <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.question}
                  onChange={e => setModalForm(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Например: Как мне записаться на курс?"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Answer Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Ответ помощника <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={modalForm.answer}
                  onChange={e => setModalForm(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="Текст ответа, который робот-помощник отобразит в чате..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* Order & Active */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Порядковый номер (сортировка)
                  </label>
                  <input
                    type="number"
                    value={modalForm.sort_order ?? 0}
                    onChange={e =>
                      setModalForm(prev => ({ ...prev, sort_order: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-400 mt-1 block">
                    Меньшее число показывается выше.
                  </span>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={modalForm.is_active}
                      onChange={e =>
                        setModalForm(prev => ({ ...prev, is_active: e.target.checked }))
                      }
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-800">
                      Отображать на сайте (активен)
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Отмена
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Сохранение...' : editingFaq ? 'Сохранить изменения' : 'Создать вопрос'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqList;
