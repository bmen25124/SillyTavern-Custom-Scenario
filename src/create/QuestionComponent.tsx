import React from 'react';
import { QuestionType, ScriptInputValues } from '../types/types';
import { ScriptInput, ScriptInputs } from './ScriptInputs';
import { CodeEditor } from './CodeEditor';

interface Option {
  value: string;
  label: string;
}

interface QuestionComponentProps {
  id: string;
  type: QuestionType;
  onTypeChange: (value: QuestionType) => void;
  inputId: string;
  onInputIdChange: (value: string) => void;
  question: string;
  onQuestionChange: (value: string) => void;
  mainScript: string;
  onMainScriptChange: (value: string) => void;
  showScript: string;
  onShowScriptChange: (value: string) => void;
  showPreview: string;
  questionPreview: string;
  isRequired: boolean;
  onRequiredChange: (value: boolean) => void;
  options: Option[];
  onOptionsChange: (options: Option[]) => void;
  defaultValue: string;
  onDefaultValueChange: (value: string) => void;
  isDefaultChecked: boolean;
  onDefaultCheckedChange: (value: boolean) => void;
  onRefreshPreview: () => void;
  isAccordionOpen: boolean;
  onAccordionToggle: () => void;
  scriptInputs: {
    inputs: ScriptInput[];
    values?: ScriptInputValues;
    onChange?: (inputId: string, value: string | boolean) => void;
  };
  isQuestionHighlightMode: boolean;
  onQuestionHighlightModeChange: (value: boolean) => void;
  isMainScriptHighlightMode: boolean;
  onMainScriptHighlightModeChange: (value: boolean) => void;
  isShowScriptHighlightMode: boolean;
  onShowScriptHighlightModeChange: (value: boolean) => void;
}

export const QuestionComponent: React.FC<QuestionComponentProps> = ({
  id,
  type,
  onTypeChange,
  inputId,
  onInputIdChange,
  question,
  onQuestionChange,
  mainScript,
  onMainScriptChange,
  showScript,
  onShowScriptChange,
  showPreview,
  questionPreview,
  isRequired,
  onRequiredChange,
  options,
  onOptionsChange,
  defaultValue,
  onDefaultValueChange,
  isDefaultChecked,
  onDefaultCheckedChange,
  onRefreshPreview,
  isAccordionOpen,
  onAccordionToggle,
  scriptInputs,
  isQuestionHighlightMode,
  onQuestionHighlightModeChange,
  isMainScriptHighlightMode,
  onMainScriptHighlightModeChange,
  isShowScriptHighlightMode,
  onShowScriptHighlightModeChange,
}) => {
  const handleAddOption = () => {
    onOptionsChange([...options, { value: '', label: '' }]);
  };

  const handleOptionChange = (index: number, field: 'value' | 'label', value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onOptionsChange(newOptions);
  };

  return (
    <div className="flex-container flexFlowColumn marginTop10">
      <div className="flex-container question-header gap10">
        <div className="flex1">
          <label>Type: </label>
          <select
            className="text_pole input-type-select"
            value={type}
            onChange={(e) => onTypeChange(e.target.value as 'text' | 'select' | 'checkbox')}
          >
            <option value="text">Text</option>
            <option value="select">Select</option>
            <option value="checkbox">Checkbox</option>
          </select>
        </div>
        <div className="flex2">
          <label>ID: </label>
          <input
            type="text"
            className="text_pole input-id"
            placeholder="Enter ID (e.g., character_name)"
            title="This ID will be used as {{answer_id}} in templates"
            value={inputId}
            onChange={(e) => onInputIdChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-container flexFlowColumn marginTop10">
        <label>Question:</label>
        <CodeEditor
          rows={2}
          placeholder="Enter question"
          value={question}
          onChange={onQuestionChange}
          language="custom-scenario-script"
          isHighlightMode={isQuestionHighlightMode}
          onHighlightModeChange={onQuestionHighlightModeChange}
        />
      </div>

      <div className="accordion marginTop10">
        <div className="accordion-header">
          <button className="menu_button accordion-toggle" onClick={onAccordionToggle}>
            <span className="accordion-icon">{isAccordionOpen ? '▼' : '▶'}</span>
            Script
          </button>
          <button className="menu_button" onClick={onRefreshPreview}>
            Refresh Preview
          </button>
        </div>
        {isAccordionOpen && (
          <div className="accordion-content">
            <div className="flex-container flexFlowColumn marginTop10 marginBottom10">
              <ScriptInputs
                type="question"
                isQuestionInput={true}
                questionId={inputId}
                inputs={scriptInputs.inputs}
                values={scriptInputs.values}
                onChange={scriptInputs.onChange}
              />
            </div>
            <CodeEditor
              rows={8}
              placeholder="Enter your main script here..."
              value={mainScript}
              onChange={onMainScriptChange}
              isHighlightMode={isMainScriptHighlightMode}
              onHighlightModeChange={onMainScriptHighlightModeChange}
            />
            <CodeEditor
              rows={4}
              placeholder="Enter your show script here..."
              value={showScript}
              onChange={onShowScriptChange}
              isHighlightMode={isShowScriptHighlightMode}
              onHighlightModeChange={onShowScriptHighlightModeChange}
            />
            <label>Preview: </label>
            <label className="show-preview">{showPreview}</label>
          </div>
        )}
      </div>

      <div className="flex-container flexFlowColumn marginTop10">
        <label>Preview:</label>
        <textarea
          className="text_pole"
          rows={2}
          readOnly={true}
          value={questionPreview || 'Preview will appear here...'}
        ></textarea>
      </div>

      <div className="flex-container alignItemsCenter marginTop10">
        <label className="checkbox_label">
          <input type="checkbox" checked={isRequired} onChange={(e) => onRequiredChange(e.target.checked)} />
          Required
        </label>
      </div>

      {type === 'select' && (
        <div className="select-options-container">
          <div className="flex-container flexFlowColumn marginTop10">
            <div className="flex-container justifySpaceBetween alignItemsCenter">
              <label>Options:</label>
              <button className="menu_button add-option-btn" onClick={handleAddOption}>
                + Add Option
              </button>
            </div>
            <div className="options-list">
              {options.map((option, index) => (
                <div key={index} className="flex-container gap10 marginTop5">
                  <input
                    type="text"
                    className="text_pole flex1"
                    placeholder="Label"
                    title={`Label of the option. This is what the user will see. Access with variables.${inputId}.label`}
                    value={option.label}
                    onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                  />
                  <input
                    type="text"
                    className="text_pole flex1"
                    placeholder="Value"
                    title={`Value of the option. This is what the user will select. Access with variables.${inputId}.value`}
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="default-value-container">
        <div className="flex-container flexFlowColumn marginTop10">
          <label>Default Value:</label>
          <div className="default-value-input-container">
            {type === 'text' && (
              <textarea
                className="text_pole textarea_compact input-default"
                rows={2}
                placeholder="Enter default value"
                value={defaultValue}
                onChange={(e) => onDefaultValueChange(e.target.value)}
              />
            )}
            {type === 'checkbox' && (
              <label className="checkbox_label checkbox-default">
                <input
                  type="checkbox"
                  checked={isDefaultChecked}
                  onChange={(e) => onDefaultCheckedChange(e.target.checked)}
                />
                Checked by default
              </label>
            )}
            {type === 'select' && (
              <select
                className="text_pole select-default"
                value={defaultValue}
                onChange={(e) => onDefaultValueChange(e.target.value)}
              >
                <option value="">Select a default value</option>
                {options.map((option, index) => (
                  <option key={index} value={option.value}>
                    {option.label || option.value}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
