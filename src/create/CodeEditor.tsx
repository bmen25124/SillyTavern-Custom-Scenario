import { hljs } from '../config';
import React, { useState } from 'react';

export const CodeEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  rows: number;
  placeholder?: string;
  language?: 'javascript' | 'custom-scenario-script';
  isHighlightMode: boolean;
  onHighlightModeChange: (value: boolean) => void;
}> = ({ value, onChange, rows, placeholder, language = 'javascript', isHighlightMode, onHighlightModeChange }) => {
  // Register custom language if not already registered
  if (language === 'custom-scenario-script' && !hljs.getLanguage('custom-scenario-script')) {
    hljs.registerLanguage('custom-scenario-script', () => ({
      case_insensitive: true,
      contains: [
        {
          className: 'variable',
          begin: '{{',
          end: '}}',
        },
      ],
    }));
  }

  // Highlight the code using hljs
  const highlightedCode = React.useMemo(() => {
    if (!value) return `<span>${placeholder || 'Enter your code here...'}</span>`;
    const result = hljs.highlight(value, { language });
    return result.value;
  }, [value, language, placeholder]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => onHighlightModeChange(!isHighlightMode)}
        style={{
          position: 'absolute',
          top: '4px',
          right: 'calc(8px + var(--scrollbar-width, 12px))',
          width: '24px',
          height: '24px',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: '#fff',
          cursor: 'pointer',
          zIndex: 1,
          opacity: 0.7,
          transition: 'opacity 0.2s',
        }}
        title={isHighlightMode ? 'Switch to Edit mode' : 'Switch to Highlight mode'}
      >
        {isHighlightMode ? '✏️' : '👁️'}
      </button>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: isHighlightMode ? `${rows * 1.5}em` : '100%',
          overflow: isHighlightMode ? 'auto' : 'hidden',
        }}
      >
        {isHighlightMode ? (
          <pre className="code-highlight" title={value ? placeholder : undefined}>
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          </pre>
        ) : (
          <textarea
            className="text_pole textarea_compact"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
            style={{
              width: '100%',
              height: '100%',
              fontFamily: 'monospace',
              resize: 'vertical',
              paddingRight: 'calc(32px + var(--scrollbar-width, 12px))',
            }}
            title={value ? placeholder : undefined}
          />
        )}
      </div>
    </div>
  );
};
