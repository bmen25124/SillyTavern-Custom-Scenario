import React from 'react';
import { QuestionType, ScriptInputValues } from '../types/types';
import { ScriptInput, ScriptInputs } from './ScriptInputs';
import { CodeEditor } from './CodeEditor';
import { Button } from '../components/Button';
import { Textarea } from '../components/Textarea';
import { Select } from '../components/Select';
import { Input } from '../components/Input';

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
      <div className="flex-container gap10">
        <div className="flex1">
          <label>Type: </label>
          <Select value={type} onChange={(e) => onTypeChange(e.target.value as 'text' | 'select' | 'checkbox')}>
            <option value="text">Text</option>
            <option value="select">Select</option>
            <option value="checkbox">Checkbox</option>
          </Select>
        </div>
        <div className="flex2">
          <label>ID: </label>
          <Input
            type="text"
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
          <Button className="accordion-toggle" onClick={onAccordionToggle}>
            <span className="accordion-icon">{isAccordionOpen ? '▼' : '▶'}</span>
            Script
          </Button>
          <Button onClick={onRefreshPreview}>Refresh Preview</Button>
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
            <label>{showPreview}</label>
          </div>
        )}
      </div>

      <div className="flex-container flexFlowColumn marginTop10">
        <label>Preview:</label>
        <Textarea rows={2} readOnly={true} value={questionPreview || 'Preview will appear here...'} />
      </div>

      <div className="flex-container alignItemsCenter marginTop10">
        <label className="checkbox_label">
          <Input type="checkbox" checked={isRequired} onChange={(e) => onRequiredChange(e.target.checked)} />
          Required
        </label>
      </div>

      {type === 'select' && (
        <div className="flex-container flexFlowColumn marginTop10">
          <div className="flex-container justifySpaceBetween alignItemsCenter">
            <label>Options:</label>
            <Button onClick={handleAddOption}>+ Add Option</Button>
          </div>
          <div className="options-list">
            {options.map((option, index) => (
              <div key={index} className="flex-container gap10 marginTop5">
                <Input
                  type="text"
                  className="flex1"
                  placeholder="Label"
                  title={`Label of the option. This is what the user will see. Access with variables.${inputId}.label`}
                  value={option.label}
                  onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                />
                <Input
                  type="text"
                  className="flex1"
                  placeholder="Value"
                  title={`Value of the option. This is what the user will select. Access with variables.${inputId}.value`}
                  value={option.value}
                  onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-container flexFlowColumn marginTop10">
        <label>Default Value:</label>
        <div>
          {type === 'text' && (
            <Textarea
              rows={2}
              placeholder="Enter default value"
              value={defaultValue}
              onChange={(e) => onDefaultValueChange(e.target.value)}
            />
          )}
          {type === 'checkbox' && (
            <label className="checkbox_label checkbox-default">
              <Input
                type="checkbox"
                checked={isDefaultChecked}
                onChange={(e) => onDefaultCheckedChange(e.target.checked)}
              />
              Checked by default
            </label>
          )}
          {type === 'select' && (
            <Select value={defaultValue} onChange={(e) => onDefaultValueChange(e.target.value)}>
              <option value="">Select a default value</option>
              {options.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label || option.value}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>
    </div>
  );
};
