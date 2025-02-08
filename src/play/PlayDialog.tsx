import React, { useRef, useEffect } from 'react';
import { Question, FullExportData } from '../scripts/types';
import { readScenarioFromPng } from '../scripts/utils/png-handlers';
import { executeMainScript, executeShowScript, interpolateText } from '../scripts/utils';
import { st_addWorldInfo, st_getRequestHeaders, st_updateCharacters, stEcho, stGo, st_getCharacters, st_getWorldNames, st_saveCharacterDebounced, st_setWorldInfoButtonClass, st_getThumbnailUrl } from '../scripts/config';

interface PlayDialogProps {
  onClose: () => void;
}

interface QuestionState extends Question {
  showPreview: string;
  questionPreview: string;
}

export const PlayDialog: React.FC<PlayDialogProps> = ({ onClose }) => {
  const [currentPageIndex, setCurrentPageIndex] = React.useState(0);
  const [scenarioData, setScenarioData] = React.useState<FullExportData | null>(null);
  const [sortedQuestions, setSortedQuestions] = React.useState<QuestionState[]>([]);
  const [layout, setLayout] = React.useState<string[][]>([]);
  const [fileBuffer, setFileBuffer] = React.useState<ArrayBuffer | null>(null);
  const [fileType, setFileType] = React.useState<'json' | 'png' | null>(null);
  const [worldName, setWorldName] = React.useState<string | undefined>();
  const [answers, setAnswers] = React.useState<Record<string, string | boolean | { label: string; value: string }>>({});
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateQuestionPreviews = async () => {
    if (!sortedQuestions.length) return;

    const updatedQuestions = await Promise.all(
      sortedQuestions.map(async (question) => {
        try {
          const showPreview = !question.showScript || await executeShowScript(question.showScript, answers, 'remove', worldName);
          let questionPreview = question.text;

          if (question.script) {
            const variables = await executeMainScript(question.script, answers, 'remove', worldName);
            questionPreview = interpolateText(question.text, variables, 'remove');
          }

          return {
            ...question,
            showPreview: showPreview ? 'SHOW' : 'HIDE',
            questionPreview,
          };
        } catch (error: any) {
          console.error('Preview update error:', error);
          return {
            ...question,
            showPreview: 'SHOW',
            questionPreview: `Script error: ${error.message}`,
          };
        }
      })
    );

    setSortedQuestions(updatedQuestions);
  };

  useEffect(() => {
    updateQuestionPreviews();
  }, [answers]);

  const handleFileSelect = async (file: File) => {
    try {
      let importedData: FullExportData;
      let buffer: ArrayBuffer | null = null;
      let type: 'json' | 'png';

      if (file.type === 'image/png') {
        buffer = await file.arrayBuffer();
        type = 'png';
        const extracted = readScenarioFromPng(buffer);
        if (!extracted) {
          await stEcho('error', 'No scenario data found in PNG file.');
          return;
        }
        importedData = extracted;
      } else {
        const text = await file.text();
        type = 'json';
        importedData = JSON.parse(text);
      }

      if (!importedData.scenario_creator) {
        await stEcho('warning', 'This scenario does not have a creator section');
        return;
      }

      // Sort questions based on layout
      const questions: QuestionState[] = [];
      const layout = importedData.scenario_creator.layout || [[...importedData.scenario_creator.questions.map(q => q.inputId)]];

      for (const questionIds of layout) {
        for (const questionId of questionIds) {
          const foundQuestion = importedData.scenario_creator.questions.find(q => q.inputId === questionId);
          if (foundQuestion) {
            questions.push({
              ...foundQuestion,
              showPreview: 'SHOW',
              questionPreview: foundQuestion.text,
            });
          }
        }
      }

      // Initialize answers with default values
      const initialAnswers: Record<string, string | boolean | { label: string; value: string }> = {};
      questions.forEach(question => {
        if (question.type === 'select' && question.options?.length) {
          const defaultOption = question.options?.find(opt => opt.value === question.defaultValue) || question.options[0];
          initialAnswers[question.inputId] = {
            label: defaultOption.label,
            value: defaultOption.value
          };
        } else if (question.type === 'checkbox') {
          initialAnswers[question.inputId] = question.defaultValue === true;
        } else {
          initialAnswers[question.inputId] = question.defaultValue || '';
        }
      });

      setScenarioData(importedData);
      setSortedQuestions(questions);
      setLayout(layout);
      setFileBuffer(buffer);
      setFileType(type);
      setWorldName(importedData.data.extensions?.world);
      setAnswers(initialAnswers);
      setValidationErrors({});
    } catch (error: any) {
      console.error('Import error:', error);
      await stEcho('error', 'Error importing scenario: ' + error.message);
    }
  };

  const handleInputChange = (questionId: string, value: string | boolean | { label: string; value: string }) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Clear validation error when input changes
    if (validationErrors[questionId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validatePage = (pageIndex: number): boolean => {
    const currentPageQuestions = sortedQuestions.filter(q =>
      layout[pageIndex].includes(q.inputId) &&
      q.showPreview === 'SHOW'
    );

    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    currentPageQuestions.forEach(question => {
      if (question.required) {
        const answer = answers[question.inputId];
        if (
          answer === undefined ||
          answer === '' ||
          (typeof answer === 'object' && answer.value === '')
        ) {
          newErrors[question.inputId] = 'This field is required';
          hasErrors = true;
        }
      }
    });

    setValidationErrors(newErrors);
    return !hasErrors;
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'next' && !validatePage(currentPageIndex)) {
      return;
    }

    const newIndex = direction === 'next' ? currentPageIndex + 1 : currentPageIndex - 1;
    if (newIndex >= 0 && newIndex < layout.length) {
      setCurrentPageIndex(newIndex);
    }
  };

  const handleSubmit = async () => {
    if (!scenarioData || !validatePage(currentPageIndex)) {
      return;
    }

    if (currentPageIndex < layout.length - 1) {
      await stEcho('warning', 'Please go to the last page before playing');
      return;
    }

    try {
      if (worldName) {
        await st_addWorldInfo(worldName, scenarioData.data.character_book, false);
      }

      const {
        descriptionScript,
        firstMessageScript,
        scenarioScript,
        personalityScript,
        characterNoteScript,
      } = scenarioData.scenario_creator || {};

      // Process description
      const descriptionVars = descriptionScript
        ? await executeMainScript(descriptionScript, answers, 'remove', worldName)
        : answers;
      const description = interpolateText(
        scenarioData.description || scenarioData.data?.description,
        descriptionVars,
        'remove',
      );

      // Process first message
      const firstMessageVars = firstMessageScript
        ? await executeMainScript(firstMessageScript, answers, 'remove', worldName)
        : answers;
      const firstMessage = interpolateText(
        scenarioData.first_mes || scenarioData.data?.first_mes,
        firstMessageVars,
        'remove',
      );

      // Process scenario
      const scenarioVars = scenarioScript
        ? await executeMainScript(scenarioScript, answers, 'remove', worldName)
        : answers;
      const processedScenario = interpolateText(
        scenarioData.scenario || scenarioData.data?.scenario,
        scenarioVars,
        'remove',
      );

      // Process personality
      const personalityVars = personalityScript
        ? await executeMainScript(personalityScript, answers, 'remove', worldName)
        : answers;
      const processedPersonality = interpolateText(
        scenarioData.personality || scenarioData.data?.personality,
        personalityVars,
        'remove',
      );

      // Update processed fields
      scenarioData.description = description;
      scenarioData.first_mes = firstMessage;
      scenarioData.data.description = description;
      scenarioData.data.first_mes = firstMessage;
      scenarioData.scenario = processedScenario;
      scenarioData.data.scenario = processedScenario;
      scenarioData.personality = processedPersonality;
      scenarioData.data.personality = processedPersonality;

      // Process character note
      if (scenarioData.data.extensions?.depth_prompt) {
        const characterNoteVars = characterNoteScript
          ? await executeMainScript(characterNoteScript, answers, 'remove', worldName)
          : answers;
        scenarioData.data.extensions.depth_prompt.prompt = interpolateText(
          scenarioData.data.extensions.depth_prompt.prompt,
          characterNoteVars,
          'remove',
        );
      }

      // Prepare form data
      const formData = new FormData();
      if (fileType === 'png' && fileBuffer) {
        formData.append('avatar', new Blob([fileBuffer], { type: 'image/png' }), 'scenario.png');
        formData.append('file_type', 'png');
      } else {
        formData.append('avatar', new Blob([JSON.stringify(scenarioData)], { type: 'application/json' }), 'scenario.json');
        formData.append('file_type', 'json');
      }

      // Send request
      const headers = st_getRequestHeaders();
      delete headers['Content-Type'];
      const response = await fetch('/api/characters/import', {
        method: 'POST',
        headers,
        body: formData,
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error('Failed to import character');
      }

      const { file_name } = await response.json();
      if (!file_name) {
        throw new Error('No file name received');
      }

      await st_updateCharacters();
      await stGo(`${file_name}.png`);

      // Update avatar
      let thumbnailUrl = st_getThumbnailUrl('avatar', `${file_name}.png`);
      await fetch(thumbnailUrl, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          pragma: 'no-cache',
          'cache-control': 'no-cache',
        },
      });
      thumbnailUrl += `&scenarioTime=${Date.now()}`;

      $('#avatar_load_preview').attr('src', thumbnailUrl);
      $('.mes').each(function() {
        const nameMatch = $(this).attr('ch_name') === scenarioData.name;
        if ((!nameMatch && $(this).attr('is_system') === 'true') || $(this).attr('is_user') === 'true') {
          return;
        }
        if (nameMatch) {
          $(this).find('.avatar img').attr('src', thumbnailUrl);
        }
      });

      // Update world info
      const chid = $('#set_character_world').data('chid');
      if (chid) {
        const characters = st_getCharacters();
        const worldName = characters[chid]?.data?.extensions?.world;
        const worldNames = st_getWorldNames();
        if (worldName && worldNames.includes(worldName)) {
          $('#character_world').val(worldName);
          st_saveCharacterDebounced();
          st_setWorldInfoButtonClass(chid, true);
        }
      }

      onClose();
    } catch (error: any) {
      console.error('Error processing scenario:', error);
      await stEcho('error', `Error processing scenario: ${error.message}`);
    }
  };

  if (!scenarioData) {
    return (
      <div className="scenario-play-dialog">
        <h2>Scenario Player</h2>
        <div className="flex-container justifyCenter marginTop10">
          <input
            type="file"
            accept=".json, .png"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
          <button className="menu_button" onClick={() => fileInputRef.current?.click()}>
            Select Scenario File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scenario-play-dialog">
      <h2>Scenario Player</h2>

      <form id="dynamic-inputs-container" className="flex-container flexFlowColumn marginTop10">
        {sortedQuestions
          .filter(question => layout[currentPageIndex].includes(question.inputId))
          .map(question => (
            <fieldset key={question.inputId} className="dynamic-input-group marginTop10">
              <div className="flex-container flexFlowColumn">
                <pre className="input-question" style={{ whiteSpace: 'pre-wrap' }}>
                  {question.questionPreview}{question.required ? ' *' : ''}
                </pre>

                {question.showPreview === 'SHOW' && (
                  <div className="input-container">
                    {question.type === 'checkbox' ? (
                      <label className="checkbox_label">
                        <input
                          type="checkbox"
                          className="dynamic-input"
                          checked={answers[question.inputId] as boolean}
                          onChange={e => handleInputChange(question.inputId, e.target.checked)}
                        />
                      </label>
                    ) : question.type === 'select' ? (
                      <select
                        className="text_pole dynamic-input"
                        value={(answers[question.inputId] as { value: string })?.value || ''}
                        onChange={e => {
                          const option = question.options?.find(opt => opt.value === e.target.value);
                          if (option) {
                            handleInputChange(question.inputId, {
                              label: option.label,
                              value: option.value
                            });
                          }
                        }}
                      >
                        {question.options?.map((opt, index) => (
                          <option key={index} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="text_pole dynamic-input"
                        placeholder={question.required ? 'Required' : 'Enter your answer'}
                        value={answers[question.inputId] as string}
                        onChange={e => handleInputChange(question.inputId, e.target.value)}
                      />
                    )}
                  </div>
                )}

                {validationErrors[question.inputId] && (
                  <span className="validation-error" style={{ color: 'red' }}>
                    {validationErrors[question.inputId]}
                  </span>
                )}
              </div>
            </fieldset>
          ))}
      </form>

      <div className="flex-container justifySpaceBetween marginTop10">
        <button
          className="menu_button"
          style={{ visibility: currentPageIndex > 0 ? 'visible' : 'hidden' }}
          onClick={() => handleNavigate('prev')}
        >
          Previous
        </button>
        <div id="page-indicator">
          Page {currentPageIndex + 1} of {layout.length}
        </div>
        {currentPageIndex < layout.length - 1 ? (
          <button className="menu_button" onClick={() => handleNavigate('next')}>
            Next
          </button>
        ) : (
          <button className="menu_button" onClick={handleSubmit}>
            Play
          </button>
        )}
      </div>
    </div>
  );
};
