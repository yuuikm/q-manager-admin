import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from 'store/hooks';
import { ADMIN_ENDPOINTS } from '@/constants/endpoints';
import { LINKS } from '@/constants/routes';
import DataTable from '@/components/shared/DataTable';
import Button from '@/components/shared/Button';
import Actions from '@/components/shared/Actions';
import { type TableColumn, type TableAction } from '@/components/shared/DataTable';

interface Question {
  question: string;
  type: 'multiple_choice' | 'single_choice' | 'true_false' | 'text';
  options?: string[];
  correct_answer: string;
  points: number;
  explanation?: string;
}

interface Test {
  id: number;
  title: string;
  description?: string;
  course_id: number;
  time_limit_minutes: number;
  passing_score: number;
  max_attempts: number;
  is_active: boolean;
  questions: Question[];
  created_by: number;
  course: {
    id: number;
    title: string;
  };
  author: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
}

interface Course {
  id: number;
  title: string;
}

// Table columns configuration
const testColumns: TableColumn[] = [
  {
    key: "test",
    label: "Тест",
  },
  {
    key: "course",
    label: "Курс",
  },
  {
    key: "settings",
    label: "Настройки",
  },
  {
    key: "status",
    label: "Статус",
  },
];

// Table actions configuration
const testActions: TableAction[] = [
  {
    key: "actions",
    label: "Действия",
  },
];

import { adminAPI } from '@/api/admin';

const Tests = () => {
  const navigate = useNavigate();
  const { token } = useAppSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const [tests, setTests] = useState<Test[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [selectedCourse] = useState<string>(searchParams.get('course') || '');
  const [pagination, setPagination] = useState<{
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  } | undefined>(undefined);
  const [authors, setAuthors] = useState<{ id: number; name: string }[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    start_date: "",
    end_date: "",
    author_id: "",
    page: 1
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    time_limit_minutes: 60,
    passing_score: 70,
    max_attempts: 3,
    total_questions: null as number | null,
    is_active: true,
    questions: [] as Question[],
  });

  // Excel upload states
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelCourseId, setExcelCourseId] = useState<string>('');
  const [parsingExcel, setParsingExcel] = useState(false);
  const [parsedTest, setParsedTest] = useState<{
    title: string;
    description: string;
    course_id?: number | string;
    time_limit_minutes?: number;
    passing_score?: number;
    total_questions?: number;
    questions: Question[];
  } | null>(null);
  const [showExcelPreview, setShowExcelPreview] = useState(false);
  const [excelStatus, setExcelStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // useSearchParams moved up

  const fetchAuthors = useCallback(async () => {
    try {
      const data = await adminAPI.getAdmins();
      setAuthors(data);
    } catch (err) {
      console.error('Error fetching authors:', err);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      if (!token) return;

      const response = await fetch(ADMIN_ENDPOINTS.COURSES, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }, [token]);

  const fetchTests = useCallback(async () => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const url = new URL(ADMIN_ENDPOINTS.TESTS);

      // Add current filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });

      // Add course filter if selected from URL/local state
      if (selectedCourse) {
        url.searchParams.append('course_id', selectedCourse);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTests(data.data || data);
        if (data.current_page) {
          setPagination({
            current_page: data.current_page,
            last_page: data.last_page,
            total: data.total,
            per_page: data.per_page
          });
        } else {
          setPagination(undefined);
        }
      } else if (response.status === 401) {
        // Handle unauthorized - token expired
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedCourse, token, navigate]);



  const handleSearch = useCallback((value: string) => {
    setFilters((prev) => {
      if (prev.search === value) return prev;
      return { ...prev, search: value, page: 1 };
    });
  }, []);

  const handleFilterChange = useCallback((newFilters: Record<string, string | number | boolean | null | undefined>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => {
      if (prev.page === page) return prev;
      return { ...prev, page };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.questions.length === 0) {
      alert('Пожалуйста, добавьте хотя бы один вопрос к тесту.');
      return;
    }

    try {
      if (!token) {
        alert('Токен авторизации не найден');
        return;
      }

      const url = editingTest
        ? `${ADMIN_ENDPOINTS.TESTS}/${editingTest.id}`
        : ADMIN_ENDPOINTS.TESTS;

      const method = editingTest ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTests();
        setShowModal(false);
        setEditingTest(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving test:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      course_id: '',
      time_limit_minutes: 60,
      passing_score: 70,
      max_attempts: 3,
      total_questions: null,
      is_active: true,
      questions: [],
    });
  };

  const handleEditTestAction = useCallback((test: Test) => {
    setEditingTest(test);
    setFormData({
      title: test.title,
      description: test.description || '',
      course_id: test.course_id.toString(),
      time_limit_minutes: test.time_limit_minutes,
      passing_score: test.passing_score,
      max_attempts: test.max_attempts,
      total_questions: (test as unknown as { total_questions: number }).total_questions || null,
      is_active: test.is_active,
      questions: test.questions,
    });
    setShowModal(true);
  }, []);

  const handleDeleteTestAction = useCallback(async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот тест?')) return;

    try {
      if (!token) {
        alert('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${ADMIN_ENDPOINTS.TESTS}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTests(prevTests => prevTests.filter(test => test.id !== id));
        alert('Тест успешно удален');
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Ошибка удаления теста');
      }
    } catch (error) {
      console.error('Ошибка удаления теста:', error);
      alert('Произошла ошибка при удалении теста');
    }
  }, [token, navigate]);

  const handleToggleTestStatusAction = useCallback(async (id: number, currentStatus: boolean) => {
    try {
      if (!token) {
        alert('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${ADMIN_ENDPOINTS.TESTS}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        setTests(prevTests =>
          prevTests.map(test =>
            test.id === id ? { ...test, is_active: !currentStatus } : test
          )
        );
        alert(`Тест ${!currentStatus ? 'активирован' : 'деактивирован'} успешно`);
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Ошибка обновления статуса теста');
      }
    } catch (error) {
      console.error('Ошибка обновления статуса теста:', error);
      alert('Произошла ошибка при обновлении статуса теста');
    }
  }, [token, navigate]);

  const handleDuplicateTestAction = useCallback(async (id: number) => {
    try {
      if (!token) {
        alert('Токен авторизации не найден');
        return;
      }

      const response = await fetch(`${ADMIN_ENDPOINTS.DUPLICATE_TEST}/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchTests();
        alert('Тест успешно дублирован');
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Ошибка дублирования теста');
      }
    } catch (error) {
      console.error('Error duplicating test:', error);
      alert('Произошла ошибка при дублировании теста');
    }
  }, [token, navigate, fetchTests]);

  useEffect(() => {
    fetchAuthors();
    fetchCourses();
  }, [fetchAuthors, fetchCourses]);

  useEffect(() => {
    fetchTests();
  }, [filters, selectedCourse, token, fetchTests]);

  useEffect(() => {
    // Event listeners for actions
    const handleEditTest = (event: CustomEvent) => {
      handleEditTestAction(event.detail);
    };

    const handleToggleTestStatus = (event: CustomEvent) => {
      handleToggleTestStatusAction(event.detail.id, event.detail.currentStatus);
    };

    const handleDuplicateTest = (event: CustomEvent) => {
      handleDuplicateTestAction(event.detail);
    };

    const handleDeleteTest = (event: CustomEvent) => {
      handleDeleteTestAction(event.detail);
    };

    window.addEventListener('editTest', handleEditTest as EventListener);
    window.addEventListener('toggleTestStatus', handleToggleTestStatus as EventListener);
    window.addEventListener('duplicateTest', handleDuplicateTest as EventListener);
    window.addEventListener('deleteTest', handleDeleteTest as EventListener);

    return () => {
      window.removeEventListener('editTest', handleEditTest as EventListener);
      window.removeEventListener('toggleTestStatus', handleToggleTestStatus as EventListener);
      window.removeEventListener('duplicateTest', handleDuplicateTest as EventListener);
      window.removeEventListener('deleteTest', handleDeleteTest as EventListener);
    };
  }, [handleEditTestAction, handleToggleTestStatusAction, handleDuplicateTestAction, handleDeleteTestAction]);

  const openModal = () => {
    setEditingTest(null);
    resetForm();
    setShowModal(true);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      question: '',
      type: 'single_choice',
      options: ['', ''],
      correct_answer: '',
      points: 1,
      explanation: '',
    };
    setFormData({
      ...formData,
      questions: [...formData.questions, newQuestion],
    });
  };

  const updateQuestion = <K extends keyof Question>(index: number, field: K, value: Question[K]) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[questionIndex].options = [...(updatedQuestions[questionIndex].options || []), ''];
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...formData.questions];
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options![optionIndex] = value;
    }
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...formData.questions];
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options!.filter((_, i) => i !== optionIndex);
    }
    setFormData({ ...formData, questions: updatedQuestions });
  };

  // Excel upload functions
  const handleExcelUpload = async () => {
    if (!excelFile || !excelCourseId) {
      setExcelStatus({ type: 'error', message: 'Выберите файл и курс' });
      return;
    }

    setParsingExcel(true);
    setExcelStatus({ type: null, message: '' });

    try {
      const data = new FormData();
      data.append('excel_file', excelFile);
      data.append('course_id', excelCourseId);

      if (!token) {
        alert('Токен авторизации не найден');
        return;
      }

      const response = await fetch(ADMIN_ENDPOINTS.PARSE_TEST_EXCEL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: data,
      });

      if (response.ok) {
        const responseData = await response.json();
        setParsedTest(responseData);
        setShowExcelPreview(true);
        setExcelStatus({
          type: 'success',
          message: `Успешно обработано ${responseData.questions.length} вопросов из Excel файла`
        });
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json();
        setExcelStatus({
          type: 'error',
          message: errorData.message || 'Ошибка при обработке Excel файла'
        });
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      setExcelStatus({
        type: 'error',
        message: 'Произошла ошибка при обработке Excel файла'
      });
    } finally {
      setParsingExcel(false);
    }
  };

  const handleExcelTestSave = async (testData: unknown) => {
    try {
      if (!token) {
        alert('Токен авторизации не найден');
        return;
      }

      const response = await fetch(ADMIN_ENDPOINTS.TESTS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        const data = await response.json();
        setExcelStatus({
          type: 'success',
          message: `Тест "${data.title}" успешно создан с ${data.questions.length} вопросами`
        });

        // Close modals and refresh tests
        setShowExcelModal(false);
        setShowExcelPreview(false);
        setParsedTest(null);
        setExcelFile(null);
        setExcelCourseId('');
        fetchTests();

        // Clear status after 3 seconds
        setTimeout(() => {
          setExcelStatus({ type: null, message: '' });
        }, 3000);
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        navigate(LINKS.loginLink);
      } else {
        const errorData = await response.json();
        setExcelStatus({
          type: 'error',
          message: errorData.message || 'Ошибка при создании теста'
        });
      }
    } catch (error) {
      console.error('Error creating test:', error);
      setExcelStatus({
        type: 'error',
        message: 'Произошла ошибка при создании теста'
      });
    }
  };

  const openExcelModal = () => {
    setShowExcelModal(true);
    setExcelFile(null);
    setExcelCourseId('');
    setExcelStatus({ type: null, message: '' });
  };

  // No early return for loading to keep component mounted

  const headerActions = (
    <div className="flex space-x-3">
      <Button onClick={openExcelModal} variant="secondary">
        Загрузить из Excel
      </Button>
      <Button onClick={openModal} variant="primary">
        Создать новый тест
      </Button>
    </div>
  );


  // Custom render functions for columns
  const renderTestColumn = useCallback((test: Test) => (
    <div>
      <div className="text-sm font-medium text-gray-900 mb-1">
        {test.title}
      </div>
      {test.description && (
        <div className="text-sm text-gray-500">{test.description}</div>
      )}
      <div className="text-xs text-gray-400 mt-1">
        {test.questions.length} вопросов • Создан{" "}
        {test.author.first_name} {test.author.last_name}
      </div>
    </div>
  ), []);

  const renderCourseColumn = useCallback((test: Test) => (
    <div className="text-sm text-gray-900">{test.course.title}</div>
  ), []);

  const renderSettingsColumn = useCallback((test: Test) => (
    <div className="space-y-1">
      <div>⏱️ {test.time_limit_minutes} мин</div>
      <div>🎯 {test.passing_score}% проходной</div>
      <div>🔄 {test.max_attempts} попыток</div>
    </div>
  ), []);

  const renderStatusColumn = useCallback((test: Test) => (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${test.is_active
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800"
        }`}
    >
      {test.is_active ? "Активен" : "Неактивен"}
    </span>
  ), []);

  const renderActionsColumn = useCallback((test: Test) => (
    <Actions
      onEdit={() => {
        window.dispatchEvent(
          new CustomEvent("editTest", { detail: test }),
        );
      }}
      onToggleStatus={() => {
        window.dispatchEvent(
          new CustomEvent("toggleTestStatus", {
            detail: { id: test.id, currentStatus: test.is_active },
          }),
        );
      }}
      onDuplicate={() => {
        window.dispatchEvent(
          new CustomEvent("duplicateTest", { detail: test.id }),
        );
      }}
      onDelete={() => {
        window.dispatchEvent(
          new CustomEvent("deleteTest", { detail: test.id }),
        );
      }}
      isActive={test.is_active}
      editLabel="Редактировать тест"
      deleteLabel="Удалить тест"
      duplicateLabel="Дублировать тест"
      showDuplicate={true}
    />
  ), []);

  // Enhanced columns and actions
  const enhancedColumns = useMemo(() => testColumns.map(column => ({
    ...column,
    render: column.key === 'test' ? renderTestColumn :
      column.key === 'course' ? renderCourseColumn :
        column.key === 'settings' ? renderSettingsColumn :
          column.key === 'status' ? renderStatusColumn :
            undefined
  })), [renderTestColumn, renderCourseColumn, renderSettingsColumn, renderStatusColumn]);

  const enhancedActions = useMemo(() => testActions.map(action => ({
    ...action,
    render: action.key === 'actions' ? renderActionsColumn : undefined
  })), [renderActionsColumn]);

  return (
    <>
      <DataTable
        title="Управление тестами"
        description="Список всех созданных тестов"
        data={tests}
        columns={enhancedColumns}
        actions={enhancedActions}
        loading={loading}
        error={null}
        emptyMessage="Тесты не найдены"
        emptyDescription="Создайте первый тест для начала работы"
        headerActions={headerActions}
        pagination={pagination}
        authors={authors}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        initialSearchValue={filters.search}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTest ? 'Редактировать тест' : 'Создать новый тест'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Test Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название теста *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Курс *
                    </label>
                    <select
                      required
                      value={formData.course_id}
                      onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Выберите курс</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Test Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Время выполнения (минуты) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      required
                      value={formData.time_limit_minutes}
                      onChange={(e) => setFormData({ ...formData, time_limit_minutes: parseInt(e.target.value) || 60 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Проходной балл (%) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={formData.passing_score}
                      onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) || 70 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Максимум попыток *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      required
                      value={formData.max_attempts}
                      onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) || 3 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Всего вопросов в тесте {formData.questions.length > 0 && `(из ${formData.questions.length} загруженных)`}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={formData.questions.length || 999}
                      value={formData.total_questions || formData.questions.length || ''}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const maxValue = formData.questions.length || 999;
                        setFormData({
                          ...formData,
                          total_questions: value > maxValue ? maxValue : (value < 1 ? null : value)
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Оставьте пустым для использования всех вопросов"
                    />
                    {formData.questions.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.total_questions
                          ? `Студенты получат случайные ${formData.total_questions} вопросов из ${formData.questions.length} загруженных`
                          : `Все ${formData.questions.length} вопросов будут использованы`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Questions Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Вопросы ({formData.questions.length})</h4>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="admin-button admin-button-primary cursor-pointer"
                    >
                      Добавить вопрос
                    </button>
                  </div>

                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {formData.questions.map((question, questionIndex) => (
                      <div key={questionIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="font-medium text-gray-900">Вопрос {questionIndex + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeQuestion(questionIndex)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Удалить
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Текст вопроса *
                            </label>
                            <textarea
                              required
                              value={question.question}
                              onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Тип вопроса *
                              </label>
                              <select
                                required
                                value={question.type}
                                onChange={(e) => updateQuestion(questionIndex, 'type', e.target.value as Question['type'])}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="single_choice">Один вариант</option>
                                <option value="multiple_choice">Несколько вариантов</option>
                                <option value="true_false">Верно/Неверно</option>
                                <option value="text">Текстовый ответ</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Баллы *
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                required
                                value={question.points}
                                onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          {/* Options for multiple choice and single choice */}
                          {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Варианты ответов *
                                </label>
                                <button
                                  type="button"
                                  onClick={() => addOption(questionIndex)}
                                  className="text-blue-600 hover:text-blue-900 text-sm"
                                >
                                  Добавить вариант
                                </button>
                              </div>
                              <div className="space-y-2">
                                {question.options?.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={option === question.correct_answer}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          updateQuestion(questionIndex, 'correct_answer', option);
                                        }
                                      }}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      title="Правильный ответ"
                                    />
                                    <input
                                      type="text"
                                      required
                                      value={option}
                                      onChange={(e) => {
                                        const oldValue = option;
                                        const newValue = e.target.value;
                                        updateOption(questionIndex, optionIndex, newValue);
                                        // If this was the correct answer, update it too
                                        if (question.correct_answer === oldValue) {
                                          updateQuestion(questionIndex, 'correct_answer', newValue);
                                        }
                                      }}
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder={`Вариант ${optionIndex + 1}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeOption(questionIndex, optionIndex)}
                                      className="text-red-600 hover:text-red-900 px-2"
                                    >
                                      Удалить
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* True/False options */}
                          {question.type === 'true_false' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Правильный ответ *
                              </label>
                              <select
                                required
                                value={question.correct_answer}
                                onChange={(e) => updateQuestion(questionIndex, 'correct_answer', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Выберите ответ</option>
                                <option value="true">Верно</option>
                                <option value="false">Неверно</option>
                              </select>
                            </div>
                          )}

                          {/* Correct Answer for text type */}
                          {question.type === 'text' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Правильный ответ *
                              </label>
                              <input
                                type="text"
                                required
                                value={question.correct_answer}
                                onChange={(e) => updateQuestion(questionIndex, 'correct_answer', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ожидаемый ответ"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Объяснение (необязательно)
                            </label>
                            <textarea
                              value={question.explanation || ''}
                              onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Объяснение правильного ответа"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Активен
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="admin-button admin-button-secondary cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="admin-button admin-button-primary cursor-pointer"
                  >
                    {editingTest ? 'Обновить тест' : 'Создать тест'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Excel Upload Modal */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Загрузить тест из Excel
              </h3>

              {excelStatus.type && (
                <div
                  className={`mb-4 p-4 rounded-md ${excelStatus.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                >
                  {excelStatus.message}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Курс *
                  </label>
                  <select
                    value={excelCourseId}
                    onChange={(e) => setExcelCourseId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Выберите курс</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Файл Excel *
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Загрузите Excel файл с вопросами теста. Правильные ответы должны быть отмечены (прав).
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExcelModal(false)}
                  className="admin-button admin-button-secondary cursor-pointer"
                  disabled={parsingExcel}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleExcelUpload}
                  className="admin-button admin-button-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={parsingExcel || !excelFile || !excelCourseId}
                >
                  {parsingExcel ? 'Обработка...' : 'Обработать Excel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Preview Modal */}
      {showExcelPreview && parsedTest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Предварительный просмотр теста - проверьте перед сохранением
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Название теста</label>
                    <input
                      type="text"
                      value={parsedTest.title}
                      onChange={(e) => setParsedTest({ ...parsedTest, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Курс</label>
                    <select
                      value={parsedTest.course_id}
                      onChange={(e) => setParsedTest({ ...parsedTest, course_id: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Время выполнения (минуты)</label>
                    <input
                      type="number"
                      value={parsedTest.time_limit_minutes}
                      onChange={(e) => setParsedTest({ ...parsedTest, time_limit_minutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Проходной балл (%)</label>
                    <input
                      type="number"
                      value={parsedTest.passing_score}
                      onChange={(e) => setParsedTest({ ...parsedTest, passing_score: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Всего вопросов в тесте (из {parsedTest.questions.length} загруженных)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={parsedTest.questions.length}
                      value={parsedTest.total_questions || parsedTest.questions.length}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        const maxValue = parsedTest.questions.length;
                        setParsedTest({
                          ...parsedTest,
                          total_questions: value > maxValue ? maxValue : (value < 1 ? 1 : value)
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Студенты получат случайные {parsedTest.total_questions || parsedTest.questions.length} вопросов из {parsedTest.questions.length} загруженных
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                  <textarea
                    value={parsedTest.description || ''}
                    onChange={(e) => setParsedTest({ ...parsedTest, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Вопросы ({parsedTest.questions.length})</h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {parsedTest.questions.map((question: Question, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-500">Вопрос {index + 1}:</span>
                          <p className="text-gray-900">{question.question}</p>
                        </div>

                        {question.options && question.options.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-500 block mb-2">Варианты ответов (выберите правильный):</span>
                            <div className="space-y-1">
                              {question.options.map((option: string, optIndex: number) => (
                                <label key={optIndex} className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${option === question.correct_answer ? 'bg-green-50 border border-green-200' : 'border border-gray-200'
                                  }`}>
                                  <input
                                    type="checkbox"
                                    checked={option === question.correct_answer}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        const updatedQuestions = [...parsedTest.questions];
                                        updatedQuestions[index].correct_answer = option;
                                        setParsedTest({ ...parsedTest, questions: updatedQuestions });
                                      }
                                    }}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                  />
                                  <span className={`text-sm flex-1 ${option === question.correct_answer ? 'text-green-600 font-semibold' : 'text-gray-700'
                                    }`}>
                                    {option}
                                    {option === question.correct_answer && ' ✓'}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-gray-500 mt-2">
                          Тип: {question.type} | Баллы: {question.points}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowExcelPreview(false)}
                    className="admin-button admin-button-secondary cursor-pointer"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExcelTestSave(parsedTest)}
                    className="admin-button admin-button-primary cursor-pointer"
                  >
                    Сохранить тест
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Tests;
