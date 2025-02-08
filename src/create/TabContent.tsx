import React from 'react';
import { CoreTab, ScriptInputValues } from '../types/types';
import { ScriptInput, ScriptInputs } from './ScriptInputs';

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
}) => {
  return (
    <div className="flex-container flexFlowColumn marginTopBot5">
      <div className="flex-container justifySpaceBetween alignItemsCenter flex1" title={contentLabel}>
        <label>{contentLabel}</label>
        <textarea
          className="text_pole textarea_compact"
          rows={4}
          placeholder={contentPlaceholder}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
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
            <textarea
              className="text_pole textarea_compact"
              rows={8}
              placeholder="Enter your script here..."
              value={script}
              onChange={(e) => onScriptChange(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className="flex-container flexFlowColumn marginTop10">
        <label>Preview:</label>
        <div className="text_pole" style={{ overflowY: 'auto', overflowX: 'hidden', maxHeight: '150px' }}>
          {previewContent || 'Preview will appear here...'}
        </div>
      </div>
    </div>
  );
};
