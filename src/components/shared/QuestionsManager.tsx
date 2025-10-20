import { type FC } from 'react';
import Button from './Button';

export interface Question {
  question: string;
  type: 'multiple_choice' | 'single_choice' | 'true_false' | 'text';
  options?: string[];
  correct_answer: string;
  points: number;
  explanation?: string;
}

interface QuestionsManagerProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
}

const QuestionsManager: FC<QuestionsManagerProps> = ({
  questions,
  onQuestionsChange,
}) => {
  const addQuestion = () => {
    const newQuestion: Question = {
      question: '',
      type: 'single_choice',
      options: ['', ''],
      correct_answer: '',
      points: 1,
      explanation: '',
    };
    onQuestionsChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    onQuestionsChange(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    onQuestionsChange(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = [...(updatedQuestions[questionIndex].options || []), ''];
    onQuestionsChange(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options![optionIndex] = value;
    }
    onQuestionsChange(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options!.filter((_, i) => i !== optionIndex);
    }
    onQuestionsChange(updatedQuestions);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium text-gray-900">
          Вопросы ({questions.length})
        </h4>
        <Button onClick={addQuestion} variant="primary">
          Добавить вопрос
        </Button>
      </div>

      <div className="space-y-6 max-h-96 overflow-y-auto">
        {questions.map((question, questionIndex) => (
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
                    onChange={(e) => updateQuestion(questionIndex, 'type', e.target.value)}
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
                          type="text"
                          required
                          value={option}
                          onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Вариант ${optionIndex + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(questionIndex, optionIndex)}
                          className="text-red-600 hover:text-red-900"
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

              {/* Correct Answer for other types */}
              {question.type !== 'true_false' && (
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
                    placeholder={question.type === 'text' ? 'Ожидаемый ответ' : 'Правильный вариант'}
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
  );
};

export default QuestionsManager;
