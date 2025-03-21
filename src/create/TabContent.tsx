import React from 'react';
import { CoreTab, ScriptInputValues } from '../types/types';
import { ScriptInput, ScriptInputs } from './ScriptInputs';
import { CodeEditor } from './CodeEditor';

interface TabContentProps {
  type: CoreTab;
  contentLabel: string;
  contentPlaceholder: string;
  content: string;
  onContentChange: (value: string) => void;
  script: string;
  onScriptChange: (value: string) => void;
  previewContent: string;
  onRefreshPreview: () => void;
  isAccordionOpen: boolean;
  onAccordionToggle: () => void;
  scriptInputs: {
    inputs: ScriptInput[];
    values?: ScriptInputValues;
    onChange?: (inputId: string, value: string | boolean) => void;
  };
  isContentHighlightMode: boolean;
  onContentHighlightModeChange: (value: boolean) => void;
  isScriptHighlightMode: boolean;
  onScriptHighlightModeChange: (value: boolean) => void;
}

export const TabContent: React.FC<TabContentProps> = ({
  type,
  contentLabel,
  contentPlaceholder,
  content,
  onContentChange,
  script,
  onScriptChange,
  previewContent,
  onRefreshPreview,
  isAccordionOpen = false,
  onAccordionToggle,
  scriptInputs,
  isContentHighlightMode,
  onContentHighlightModeChange,
  isScriptHighlightMode,
  onScriptHighlightModeChange,
}) => {
  return (
    <div className="flex-container flexFlowColumn marginTopBot5">
      <div className="flex-container flex1 flexFlowColumn" title={contentLabel}>
        <label>{contentLabel}</label>
        <CodeEditor
          rows={4}
          placeholder={contentPlaceholder}
          value={content}
          onChange={onContentChange}
          language="custom-scenario-script"
          isHighlightMode={isContentHighlightMode}
          onHighlightModeChange={onContentHighlightModeChange}
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
                type={type}
                inputs={scriptInputs.inputs}
                values={scriptInputs.values}
                onChange={scriptInputs.onChange}
              />
            </div>
            <CodeEditor
              rows={8}
              placeholder="Enter your script here..."
              value={script}
              onChange={onScriptChange}
              isHighlightMode={isScriptHighlightMode}
              onHighlightModeChange={onScriptHighlightModeChange}
            />
          </div>
        )}
      </div>
      <div className="flex-container flexFlowColumn marginTop10">
        <label>Preview:</label>
        <textarea
          className="text_pole"
          rows={4}
          readOnly={true}
          value={previewContent || 'Preview will appear here...'}
        ></textarea>
      </div>
    </div>
  );
};
