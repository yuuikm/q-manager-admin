import React, { type FC, useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage, type FormikProps } from 'formik';
import * as Yup from 'yup';

// Form field types
export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'email' 
  | 'password' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'file' 
  | 'date' 
  | 'time' 
  | 'datetime-local'
  | 'searchable-select'
  | 'custom';

// Option type for select fields
export interface SelectOption {
  value: string | number;
  label: string;
}

// Form field configuration
export interface FormField {
  name: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[];
  rows?: number; // for textarea
  min?: number; // for number fields
  max?: number; // for number fields
  step?: number; // for number fields
  accept?: string; // for file fields
  multiple?: boolean; // for file/select fields
  disabled?: boolean;
  className?: string;
  customRender?: (field: FormField, formik: FormikProps<any>) => React.ReactNode;
  validation?: Yup.Schema<any>;
  conditional?: {
    field: string;
    value: any;
  };
}

// Form configuration
export interface FormConfig {
  title: string;
  description?: string;
  fields: FormField[];
  submitButtonText: string;
  cancelButtonText?: string;
  onSubmit: (values: any, formikHelpers: any) => Promise<void>;
  onCancel?: () => void;
  initialValues: any;
  validationSchema: Yup.ObjectSchema<any>;
  loading?: boolean;
  className?: string;
}

// Searchable select component
interface SearchableSelectProps {
  field: FormField;
  formik: FormikProps<any>;
  options: SelectOption[];
  onSearch: (value: string) => void;
  showDropdown: boolean;
  onToggleDropdown: () => void;
}

const SearchableSelect: FC<SearchableSelectProps> = ({
  field,
  formik,
  options,
  onSearch,
  showDropdown,
  onToggleDropdown,
}) => {
  const [searchValue, setSearchValue] = useState(formik.values[field.name] || '');

  // Sync search value with formik value
  useEffect(() => {
    setSearchValue(formik.values[field.name] || '');
  }, [formik.values[field.name]]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    formik.setFieldValue(field.name, value);
    onSearch(value);
  };

  const handleSelect = (option: SelectOption) => {
    formik.setFieldValue(field.name, option.value);
    setSearchValue(option.label);
    onToggleDropdown();
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchValue}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={onToggleDropdown}
        placeholder={field.placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${field.className || ''}`}
      />
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main FormController component
const FormController: FC<FormConfig> = ({
  title,
  description,
  fields,
  submitButtonText,
  cancelButtonText = 'Отмена',
  onSubmit,
  onCancel,
  initialValues,
  validationSchema,
  loading = false,
  className = '',
}) => {
  const [searchableOptions, setSearchableOptions] = useState<Record<string, SelectOption[]>>({});
  const [showDropdowns, setShowDropdowns] = useState<Record<string, boolean>>({});

  // Initialize searchable select options
  useEffect(() => {
    const searchableFields = fields.filter(field => field.type === 'searchable-select');
    const initialOptions: Record<string, SelectOption[]> = {};
    const initialDropdowns: Record<string, boolean> = {};
    
    searchableFields.forEach(field => {
      initialOptions[field.name] = field.options || [];
      initialDropdowns[field.name] = false;
    });
    
    setSearchableOptions(initialOptions);
    setShowDropdowns(initialDropdowns);
  }, [fields]);

  const handleSearchableSearch = (fieldName: string, value: string) => {
    const field = fields.find(f => f.name === fieldName);
    if (field && field.options) {
      const filtered = field.options.filter(option =>
        option.label.toLowerCase().includes(value.toLowerCase())
      );
      setSearchableOptions(prev => ({
        ...prev,
        [fieldName]: filtered
      }));
    }
  };

  const toggleDropdown = (fieldName: string) => {
    setShowDropdowns(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  // Helper function to check if field should be shown based on conditional logic
  const shouldShowField = (field: FormField, formik: FormikProps<any>) => {
    if (!field.conditional) return true;
    
    const { field: conditionalField, value: conditionalValue } = field.conditional;
    const fieldValue = formik.values[conditionalField];
    
    return fieldValue === conditionalValue;
  };

  const renderField = (field: FormField, formik: FormikProps<any>) => {
    if (field.customRender) {
      return field.customRender(field, formik);
    }

    const baseClasses = `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${field.className || ''}`;
    const errorClasses = formik.errors[field.name] && formik.touched[field.name] 
      ? 'border-red-500' 
      : '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'date':
      case 'time':
      case 'datetime-local':
        return (
          <Field
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            disabled={field.disabled}
            className={`${baseClasses} ${errorClasses}`}
          />
        );

      case 'number':
        return (
          <Field
            type="number"
            name={field.name}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            disabled={field.disabled}
            className={`${baseClasses} ${errorClasses}`}
          />
        );

      case 'textarea':
        return (
          <Field
            as="textarea"
            name={field.name}
            placeholder={field.placeholder}
            rows={field.rows || 3}
            disabled={field.disabled}
            className={`${baseClasses} ${errorClasses}`}
          />
        );

      case 'select':
        return (
          <Field
            as="select"
            name={field.name}
            disabled={field.disabled}
            className={`${baseClasses} ${errorClasses}`}
          >
            <option value="">{field.placeholder || 'Выберите...'}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Field>
        );

      case 'searchable-select':
        return (
          <SearchableSelect
            field={field}
            formik={formik}
            options={searchableOptions[field.name] || []}
            onSearch={(value) => handleSearchableSearch(field.name, value)}
            showDropdown={showDropdowns[field.name] || false}
            onToggleDropdown={() => toggleDropdown(field.name)}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <Field
              type="checkbox"
              name={field.name}
              disabled={field.disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              {field.label}
            </label>
          </div>
        );

      case 'file':
        return (
          <input
            type="file"
            name={field.name}
            accept={field.accept}
            multiple={field.multiple}
            disabled={field.disabled}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] || null;
              formik.setFieldValue(field.name, file);
            }}
            className={`${baseClasses} ${errorClasses}`}
          />
        );

      default:
        return (
          <Field
            type="text"
            name={field.name}
            placeholder={field.placeholder}
            disabled={field.disabled}
            className={`${baseClasses} ${errorClasses}`}
          />
        );
    }
  };

  return (
    <div className={`admin-card ${className}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-gray-600 mt-1">{description}</p>
        )}
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {(formik) => {
          // Debug validation
          useEffect(() => {
            console.log('Form validation status:', {
              isValid: formik.isValid,
              errors: formik.errors,
              values: formik.values,
              touched: formik.touched
            });
          }, [formik.isValid, formik.errors, formik.values, formik.touched]);

          return (
          <Form className="space-y-6">
            {fields.map((field) => {
              // Skip rendering if field doesn't meet conditional requirements
              if (!shouldShowField(field, formik)) {
                return null;
              }

              return (
                <div key={field.name}>
                  {field.type !== 'checkbox' && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                  )}
                  
                  {renderField(field, formik)}
                  
                  <ErrorMessage
                    name={field.name}
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
              );
            })}

            <div className="flex justify-end space-x-3 pt-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="admin-button admin-button-secondary cursor-pointer"
                  disabled={loading}
                >
                  {cancelButtonText}
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !formik.isValid}
                className="admin-button admin-button-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  if (!formik.isValid) {
                    console.log('Button clicked - Form is invalid. Errors:', formik.errors);
                    console.log('Current values:', formik.values);
                  }
                }}
              >
                {loading ? 'Загрузка...' : submitButtonText}
              </button>
            </div>
          </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default FormController;
