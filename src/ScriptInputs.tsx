import React from 'react';
import { CoreTab, QuestionType, ScriptInputValues } from './scripts/types';

export interface ScriptInput {
  id: string;
  type: QuestionType;
  defaultValue: string | boolean;
  selectOptions?: Array<{ value: string; label: string }>;
}

interface ScriptInputsProps {
  type: CoreTab;
  inputs: ScriptInput[];
  values?: ScriptInputValues;
  onChange?: (inputId: string, value: string | boolean) => void;
  isQuestionInput?: boolean;
  questionId?: string;
}

function formatValue(value: boolean | string): string {
  return typeof value === 'boolean' ? value.toString() : value;
}

export const ScriptInputs: React.FC<ScriptInputsProps> = ({
  type,
  inputs,
  values,
  onChange,
  isQuestionInput = false,
  questionId,
}) => {
  React.useEffect(() => {
    const initializedValues: Record<string, string> = {};
    inputs.forEach((input) => {
      if (isQuestionInput && questionId && values?.question) {
        const questionValues = values.question[questionId] || {};
        const value = questionValues[input.id] as string | undefined;
        initializedValues[input.id] = value ?? formatValue(input.defaultValue);
      } else if (values?.[type]) {
        const typeValues = values[type] as Record<string, string>;
        const value = typeValues[input.id];
        initializedValues[input.id] = value ?? formatValue(input.defaultValue);
      } else {
        initializedValues[input.id] = formatValue(input.defaultValue);
      }
    });
  }, [inputs, values, type, isQuestionInput, questionId]);

  const handleChange = (inputId: string, value: string | boolean) => {
    onChange?.(inputId, value);
  };

  return (
    <div className="script-inputs-container">
      {inputs.map((input) => {
        const helpText =
          input.type === 'select'
            ? `Access using: variables.${input.id}.value and variables.${input.id}.label`
            : `Access using: variables.${input.id}`;

        return (
          <div key={input.id} className="script-input-group">
            <label htmlFor={`script-input-${input.id}-${type}`} title={helpText}>
              {input.id}:
            </label>
            {input.type === 'checkbox' ? (
              <input
                type="checkbox"
                className="text_pole"
                checked={
                  !!(isQuestionInput && questionId
                    ? values?.question?.[questionId]?.[input.id]
                    : values?.[type]?.[input.id])
                }
                onChange={(e) => handleChange(input.id, e.target.checked)}
                title={helpText}
              />
            ) : input.type === 'select' ? (
              <select
                className="text_pole"
                value={
                  isQuestionInput && questionId
                    ? (values?.question?.[questionId]?.[input.id] ?? '')
                    : ((values?.[type]?.[input.id] as string) ?? '')
                }
                onChange={(e) => handleChange(input.id, e.target.value)}
                title={helpText}
              >
                <option value="">Select an option</option>
                {input.selectOptions?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="text_pole"
                value={
                  isQuestionInput && questionId
                    ? (values?.question?.[questionId]?.[input.id] ?? '')
                    : ((values?.[type]?.[input.id] as string) ?? '')
                }
                onChange={(e) => handleChange(input.id, e.target.value)}
                title={helpText}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
