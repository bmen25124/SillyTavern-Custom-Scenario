import React, { useRef } from 'react';
import { TabContent } from './TabContent';
import {
  TabId,
  QuestionType,
  createEmptyScenarioCreateData,
  ScenarioCreateData,
  FullExportData,
  ScriptInputValues,
  Question as ScenarioQuestion,
} from './scripts/types';
import { convertImportedData, loadScenarioCreateData, saveScenarioCreateData } from './scripts/create/data-handlers';
import { applyScenarioExportDataToSidebar } from './scripts/create/ui-state';
import { readScenarioFromPng } from './scripts/utils/png-handlers';
import { QuestionTabButton } from './QuestionTabButton';
import { QuestionComponent } from './QuestionComponent';
import { PageTabButton } from './PageTabButton';
import { stEcho } from './scripts/config';

// @ts-ignore
import { uuidv4 } from '../../../../utils.js';
import { executeMainScript, executeShowScript, interpolateText } from './scripts/utils';
import { ScriptInput } from './ScriptInputs';

interface Question {
  id: string;
  inputId: string;
  page: number;
  type: QuestionType;
  question: string;
  mainScript: string;
  showScript: string;
  showPreview: string;
  questionPreview: string;
  isRequired: boolean;
  options: { value: string; label: string }[];
  defaultValue: string;
  isDefaultChecked: boolean;
}

interface CreateDialogProps {}

export const CreateDialog: React.FC<CreateDialogProps> = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialData = loadScenarioCreateData();
  const [scriptInputValues, setScriptInputValues] = React.useState<ScriptInputValues>(initialData.scriptInputValues);

  const [description, setDescription] = React.useState(initialData.description);
  const [descriptionScript, setDescriptionScript] = React.useState(initialData.descriptionScript);
  const [descriptionPreview, setDescriptionPreview] = React.useState('');

  const [firstMessage, setFirstMessage] = React.useState(initialData.firstMessage);
  const [firstMessageScript, setFirstMessageScript] = React.useState(initialData.firstMessageScript);
  const [firstMessagePreview, setFirstMessagePreview] = React.useState('');

  const [scenario, setScenario] = React.useState(initialData.scenario);
  const [scenarioScript, setScenarioScript] = React.useState(initialData.scenarioScript);
  const [scenarioPreview, setScenarioPreview] = React.useState('');

  const [personality, setPersonality] = React.useState(initialData.personality);
  const [personalityScript, setPersonalityScript] = React.useState(initialData.personalityScript);
  const [personalityPreview, setPersonalityPreview] = React.useState('');

  const [characterNote, setCharacterNote] = React.useState(initialData.characterNote);
  const [characterNoteScript, setCharacterNoteScript] = React.useState(initialData.characterNoteScript);
  const [characterNotePreview, setCharacterNotePreview] = React.useState('');

  // It is only for initializing activeTab. DO NOT USE THIS FOR ANYTHING ELSE.
  const questionInputIdAndIdMap: Map<string, string> = new Map();
  initialData.questions.forEach((q) => {
    questionInputIdAndIdMap.set(q.inputId, uuidv4());
  });
  const [tabAccordionStates, setTabAccordionStates] = React.useState<Record<string, boolean>>({
    description: true,
    'first-message': false,
    scenario: false,
    personality: false,
    'character-note': false,
  });

  const [questionAccordionStates, setQuestionAccordionStates] = React.useState<Record<string, boolean>>({});

  const [questions, setQuestions] = React.useState<Question[]>(
    initialData.questions
      .map((q) => {
        // initialData.layout is an array of arrays of question IDs
        const page = initialData.layout.findIndex((page) => page.includes(q.inputId)) + 1;
        if (page === 0) {
          return null;
        }

        const uuid = questionInputIdAndIdMap.get(q.inputId);
        if (!uuid) {
          throw new Error(`Question ID "${q.inputId}" not found in questionInputIdAndIdMap`);
        }

        return {
          id: uuid,
          inputId: q.inputId,
          type: q.type,
          question: q.text,
          mainScript: q.script,
          showScript: q.showScript,
          showPreview: 'SHOW',
          questionPreview: '',
          isRequired: q.required,
          options: q.options ?? [],
          defaultValue: typeof q.defaultValue === 'string' ? q.defaultValue : '',
          isDefaultChecked: q.defaultValue === true,
          page,
        };
      })
      .filter((q) => q !== null),
  );

  const [activeTab, setActiveTab] = React.useState<TabId>(
    initialData.activeTab.startsWith('question-')
      ? `question-${questionInputIdAndIdMap.get(initialData.activeTab.replace('question-', ''))}`
      : initialData.activeTab,
  );

  const [currentPage, setCurrentPage] = React.useState(
    initialData.activeTab.startsWith('question-')
      ? initialData.layout.findIndex((page) => page.includes(initialData.activeTab.replace('question-', ''))) + 1
      : 1,
  );
  // Initialize pages based on layout - if layout has 3 arrays, we'll have pages [1,2,3]
  const [pages, setPages] = React.useState(initialData.layout.map((_, index) => index + 1));
  const [isAnimating, setIsAnimating] = React.useState(false);
  const ANIMATION_DURATION = 300; // Match this with CSS animation duration (0.3s = 300ms)

  const getWorldName = () => ($('#character_world').val() as string) || undefined;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processImportedData = async (importedData: FullExportData, scenarioData: ScenarioCreateData) => {
        // Set pages based on layout
        const newPages = scenarioData.layout.map((_, index) => index + 1);
        setPages(newPages);
        setCurrentPage(1); // Reset to first page

        // Update all state with imported data
        setDescription(scenarioData.description);
        setDescriptionScript(scenarioData.descriptionScript);
        setFirstMessage(scenarioData.firstMessage);
        setFirstMessageScript(scenarioData.firstMessageScript);
        setScenario(scenarioData.scenario);
        setScenarioScript(scenarioData.scenarioScript);
        setPersonality(scenarioData.personality);
        setPersonalityScript(scenarioData.personalityScript);
        setCharacterNote(scenarioData.characterNote);
        setCharacterNoteScript(scenarioData.characterNoteScript);
        setScriptInputValues(scenarioData.scriptInputValues);

        // Update questions
        const newQuestions = scenarioData.questions
          .map((q) => ({
            id: uuidv4(),
            inputId: q.inputId,
            type: q.type,
            page: scenarioData.layout.findIndex((page) => page.includes(q.inputId)) + 1,
            question: q.text,
            mainScript: q.script,
            showScript: q.showScript,
            showPreview: 'SHOW',
            questionPreview: '',
            isRequired: q.required,
            options: q.options ?? [],
            defaultValue: typeof q.defaultValue === 'string' ? q.defaultValue : '',
            isDefaultChecked: q.defaultValue === true,
          }))
          .filter((q) => q.page > 0);

        setQuestions(newQuestions);

        // Apply imported data to character sidebar
        applyScenarioExportDataToSidebar(importedData);
      };

      if (file.type === 'image/png') {
        const buffer = await file.arrayBuffer();
        const importedData = readScenarioFromPng(buffer);
        const scenarioData = await convertImportedData(file);
        if (scenarioData) {
          await processImportedData(importedData, scenarioData);
        }
      } else {
        // Handle JSON files
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (!event.target?.result) {
            return;
          }
          try {
            const importedData = JSON.parse(event.target.result as string) as FullExportData;
            const scenarioData = await convertImportedData(importedData);
            if (scenarioData) {
              await processImportedData(importedData, scenarioData);
            }
          } catch (error) {
            console.error('Import error:', error);
            stEcho('error', 'Failed to import scenario data. Please check the file and try again.');
          }
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error('Import error:', error);
      stEcho('error', 'Failed to import scenario data. Please check the file and try again.');
    }

    // Reset file input for future imports
    e.target.value = '';
  };

  const handleTabClick = (tab: TabId) => {
    setActiveTab(tab);
    saveScenarioCreateData(
      createScenarioData({
        activeTab: tab.startsWith('question-')
          ? `question-${questions.find((q) => q.id === tab.replace('question-', ''))?.inputId || ''}`
          : tab,
      }),
    );
  };

  const handleAddPage = () => {
    const newPageNumber = Math.max(...pages) + 1;
    const newPages = [...pages, newPageNumber];
    setPages(newPages);
    saveScenarioCreateData(
      createScenarioData({
        layout: newPages.map((pageNum) => questions.filter((q) => q.page === pageNum).map((q) => q.inputId)),
      }),
    );
  };

  const handleRemovePage = () => {
    if (pages.length <= 1) return; // Don't remove the last page

    const questionCount = questions.filter((q) => q.page === currentPage).length;
    if (questionCount > 0) {
      stEcho('warning', 'Cannot remove page with questions. Please move questions to another page first.');
      return;
    }

    // Move questions from current page to previous page
    const previousPage = pages[pages.indexOf(currentPage) - 1] || pages[pages.indexOf(currentPage) + 1];

    // Create new pages array without current page
    const newPages = pages.filter((p) => p !== currentPage);

    // Renumber pages sequentially
    const renumberedPages = newPages.map((_, index) => index + 1);

    // Create a mapping from old to new page numbers
    const pageMapping = Object.fromEntries(newPages.map((oldPage, index) => [oldPage, index + 1]));

    // Update questions with new page numbers
    const updatedQuestions = questions.map((q) => {
      if (q.page === currentPage) {
        return { ...q, page: pageMapping[previousPage] };
      }
      return { ...q, page: pageMapping[q.page] };
    });

    setQuestions(updatedQuestions);
    setPages(renumberedPages);
    setCurrentPage(pageMapping[previousPage]);

    saveScenarioCreateData(
      createScenarioData({
        questions: updatedQuestions.map((q) => ({
          inputId: q.inputId,
          text: q.question,
          script: q.mainScript,
          type: q.type,
          defaultValue: q.type === 'checkbox' ? q.isDefaultChecked : q.defaultValue,
          required: q.isRequired,
          options: q.options,
          showScript: q.showScript,
        })),
        layout: renumberedPages.map((pageNum) =>
          updatedQuestions.filter((q) => q.page === pageNum).map((q) => q.inputId),
        ),
      }),
    );
  };

  const handleMovePage = async (direction: 'left' | 'right') => {
    if (isAnimating) return;
    const currentIndex = pages.indexOf(currentPage);
    const canMove = direction === 'left' ? currentIndex > 0 : currentIndex < pages.length - 1;

    if (!canMove) return;

    setIsAnimating(true);
    const animationClass = `moving-${direction}`;
    const adjacentIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

    // Add animation class
    const pageButtons = document.querySelector('#scenario-create-dialog .page-tab-buttons');
    pageButtons?.children[currentIndex]?.classList.add(animationClass);

    // Wait for animation
    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DURATION));

    const newPages = [...pages];
    [newPages[currentIndex], newPages[adjacentIndex]] = [newPages[adjacentIndex], newPages[currentIndex]];

    // Renumber pages sequentially
    const renumberedPages = newPages.map((_, index) => index + 1);
    setPages(renumberedPages);

    // Create a mapping from old to new page numbers
    const pageMapping = Object.fromEntries(newPages.map((oldPage, index) => [oldPage, index + 1]));

    // Update questions with new page numbers
    const updatedQuestions = questions.map((q) => ({
      ...q,
      page: pageMapping[q.page],
    }));
    setQuestions(updatedQuestions);

    // Update current page to its new number
    setCurrentPage(pageMapping[currentPage]);

    // Remove animation class and cleanup
    pageButtons?.children[currentIndex]?.classList.remove(animationClass);
    setIsAnimating(false);

    saveScenarioCreateData(
      createScenarioData({
        questions: updatedQuestions.map(questionMappers.toScenarioFormat),
        layout: renumberedPages.map((pageNum) =>
          updatedQuestions.filter((q) => q.page === pageNum).map((q) => q.inputId),
        ),
      }),
    );
  };

  const handleMovePageLeft = () => handleMovePage('left');
  const handleMovePageRight = () => handleMovePage('right');

  const handleMoveQuestion = (direction: 'left' | 'right') => {
    if (!activeTab.startsWith('question-')) return;
    const questionId = activeTab.replace('question-', '');
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    const currentQuestions = questions.filter((q) => q.page === question.page);
    const currentIndex = currentQuestions.findIndex((q) => q.id === questionId);
    const canMove = direction === 'left' ? currentIndex > 0 : currentIndex < currentQuestions.length - 1;

    if (!canMove) return;

    const newQuestions = [...questions];
    const questionToMove = newQuestions.find((q) => q.id === questionId);
    const adjacentQuestion =
      direction === 'left' ? currentQuestions[currentIndex - 1] : currentQuestions[currentIndex + 1];

    if (questionToMove && adjacentQuestion) {
      const adjacentIndex = newQuestions.findIndex((q) => q.id === adjacentQuestion.id);
      newQuestions[newQuestions.findIndex((q) => q.id === questionId)] = adjacentQuestion;
      newQuestions[adjacentIndex] = questionToMove;
      setQuestions(newQuestions);
      saveQuestionChanges(newQuestions);
    }
  };

  const handleMoveQuestionLeft = () => handleMoveQuestion('left');
  const handleMoveQuestionRight = () => handleMoveQuestion('right');

  const saveQuestionChanges = (updatedQuestions: Question[], newActiveTab?: TabId) => {
    saveScenarioCreateData(
      createScenarioData({
        questions: updatedQuestions.map(questionMappers.toScenarioFormat),
        layout: pages.map((pageNum) => updatedQuestions.filter((q) => q.page === pageNum).map((q) => q.inputId)),
        activeTab: newActiveTab ?? activeTab,
      }),
    );
  };

  const handleMoveQuestionToPage = (pageNumber: string) => {
    if (!activeTab.startsWith('question-') || !pageNumber) return;
    const questionId = activeTab.replace('question-', '');
    const targetPage = parseInt(pageNumber, 10);
    const updatedQuestions = questions.map((q) => (q.id === questionId ? { ...q, page: targetPage } : q));
    setQuestions(updatedQuestions);
    setCurrentPage(targetPage);
    saveQuestionChanges(updatedQuestions);
  };

  const handleReset = () => {
    const emptyData = createEmptyScenarioCreateData();

    // Reset all state variables
    setActiveTab(activeTab.startsWith('question-') ? 'description' : activeTab);
    setDescription(emptyData.description);
    setDescriptionScript(emptyData.descriptionScript);
    setDescriptionPreview('');
    setFirstMessage(emptyData.firstMessage);
    setFirstMessageScript(emptyData.firstMessageScript);
    setFirstMessagePreview('');
    setScenario(emptyData.scenario);
    setScenarioScript(emptyData.scenarioScript);
    setScenarioPreview('');
    setPersonality(emptyData.personality);
    setPersonalityScript(emptyData.personalityScript);
    setPersonalityPreview('');
    setCharacterNote(emptyData.characterNote);
    setCharacterNoteScript(emptyData.characterNoteScript);
    setCharacterNotePreview('');

    // Reset script input values
    setScriptInputValues(emptyData.scriptInputValues);

    // Reset pages
    const initialPages = emptyData.layout.map((_, index) => index + 1);
    setPages(initialPages);
    setCurrentPage(1);

    // Reset questions
    setQuestions([]);

    saveScenarioCreateData(
      createScenarioData({
        activeTab: activeTab.startsWith('question-') ? 'description' : activeTab,
        description: emptyData.description,
        descriptionScript: emptyData.descriptionScript,
        firstMessage: emptyData.firstMessage,
        firstMessageScript: emptyData.firstMessageScript,
        scenario: emptyData.scenario,
        scenarioScript: emptyData.scenarioScript,
        personality: emptyData.personality,
        personalityScript: emptyData.personalityScript,
        characterNote: emptyData.characterNote,
        characterNoteScript: emptyData.characterNoteScript,
        questions: [],
        layout: [[]],
        scriptInputValues: emptyData.scriptInputValues,
        version: emptyData.version,
        worldName: emptyData.worldName,
      }),
    );
  };

  const handleAddQuestion = () => {
    const existingIds = questions.map((q) => q.inputId);
    let newNumber = 1;
    while (existingIds.includes(`id_${newNumber}`)) {
      newNumber++;
    }
    const newId = `id_${newNumber}`;

    const newQuestion: Question = {
      id: uuidv4(),
      page: currentPage,
      type: 'text',
      inputId: newId,
      question: '',
      mainScript: '',
      showScript: '',
      showPreview: '',
      questionPreview: '',
      isRequired: false,
      options: [],
      defaultValue: '',
      isDefaultChecked: false,
    };
    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    setActiveTab(`question-${newQuestion.id}`);
    saveQuestionChanges(updatedQuestions, `question-${newQuestion.inputId}`);
  };

  const questionMappers = {
    toScriptInput: (q: Question): ScriptInput => ({
      id: q.inputId,
      type: q.type,
      defaultValue: q.type === 'checkbox' ? q.isDefaultChecked : q.defaultValue,
      selectOptions: q.type === 'select' ? q.options : undefined,
    }),

    toScenarioFormat: (q: Question): ScenarioQuestion => ({
      inputId: q.inputId,
      text: q.question,
      script: q.mainScript,
      type: q.type,
      defaultValue: q.type === 'checkbox' ? q.isDefaultChecked : q.defaultValue,
      required: q.isRequired,
      options: q.options,
      showScript: q.showScript,
    }),
  };

  const createScenarioData = (override?: Partial<ScenarioCreateData>): ScenarioCreateData => {
    // Map local questions to ScenarioCreateData question format
    const exportQuestions = questions.map(questionMappers.toScenarioFormat);

    // Create layout array based on questions and pages
    const layout = pages.map((pageNum) => questions.filter((q) => q.page === pageNum).map((q) => q.inputId));

    // Return ScenarioCreateData format
    const baseData: ScenarioCreateData = {
      description,
      descriptionScript,
      firstMessage,
      firstMessageScript,
      scenario,
      scenarioScript,
      personality,
      personalityScript,
      characterNote,
      characterNoteScript,
      questions: exportQuestions,
      layout,
      activeTab: activeTab.startsWith('question-')
        ? `question-${questions.find((q) => q.id === activeTab.replace('question-', ''))?.inputId || ''}`
        : activeTab,
      scriptInputValues,
      version: initialData.version,
      worldName: initialData.worldName,
    };

    return { ...baseData, ...override };
  };

  const mapValuesToAnswers = (values: Record<string, string>) => {
    const answers: Record<string, string | boolean | { label: string; value: string }> = {};
    for (const [key, value] of Object.entries(values)) {
      const question = questions.find((q) => q.inputId === key);
      if (!question) continue;

      if (question.type === 'select') {
        const option = question.options.find((opt) => opt.value === value);
        if (option) {
          answers[key] = {
            label: option.label,
            value,
          };
        }
      } else {
        answers[key] = value;
      }
    }
    return answers;
  };

  const updatePreview = async (
    values: Record<string, string>,
    script: string,
    content: string,
    setContentPreview?: (value: string) => void,
  ): Promise<string> => {
    const answers = mapValuesToAnswers(values);

    try {
      // Execute script if exists
      const variables = script ? await executeMainScript(script, answers, 'remove', getWorldName()) : answers;

      // Interpolate content with variables
      const interpolated = interpolateText(content, variables, 'variableName');
      setContentPreview ? setContentPreview(interpolated) : undefined;
      return interpolated;
    } catch (error: any) {
      console.error('Preview update/script execute error:', error);
      setContentPreview ? setContentPreview(`Preview update/script execute error: ${error.message}`) : undefined;
      return `Preview update/script execute error: ${error.message}`;
    }
  };

  const updateShowScriptPreview = async (
    values: Record<string, string>,
    script: string,
    content: string,
  ): Promise<string> => {
    const answers = mapValuesToAnswers(values);

    try {
      // Execute script if exists
      const result = script ? executeShowScript(script, answers, 'remove', getWorldName()) : true;
      return result ? 'SHOW' : 'HIDE';
    } catch (error: any) {
      console.error('Show script preview update/script execute error:', error);
      return `Show script preview update/script execute error: ${error.message}`;
    }
  };

  return (
    <div id="scenario-create-dialog">
      <h2>Scenario Creator</h2>
      <div className="flex-container tab-navigation spaceBetween">
        <div className="flex-container">
          <button
            className={`tab-button menu_button ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => handleTabClick('description')}
          >
            Description
          </button>
          <button
            className={`tab-button menu_button ${activeTab === 'first-message' ? 'active' : ''}`}
            onClick={() => handleTabClick('first-message')}
          >
            First Message
          </button>
          <button
            className={`tab-button menu_button ${activeTab === 'scenario' ? 'active' : ''}`}
            onClick={() => handleTabClick('scenario')}
          >
            Scenario
          </button>
          <button
            className={`tab-button menu_button ${activeTab === 'personality' ? 'active' : ''}`}
            onClick={() => handleTabClick('personality')}
          >
            Personality
          </button>
          <button
            className={`tab-button menu_button ${activeTab === 'character-note' ? 'active' : ''}`}
            onClick={() => handleTabClick('character-note')}
          >
            Character Note
          </button>
        </div>
        <div className="flex-container justifyEnd gap10">
          <input
            type="file"
            accept=".json, .png"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button className="menu_button" onClick={() => fileInputRef.current?.click()}>
            Import
          </button>
          <div className="export-container" style={{ position: 'relative', paddingTop: '5px', paddingBottom: '5px' }}>
            <button
              className="menu_button"
              style={{ height: '100%', paddingTop: '0px', paddingBottom: '0px', margin: '0' }}
            >
              Export
            </button>
            <div className="list-group" style={{ display: 'none', position: 'absolute', zIndex: 9999 }}>
              <div className="export-format list-group-item">PNG</div>
              <div className="export-format list-group-item">JSON</div>
            </div>
          </div>
          <button className="menu_button" onClick={handleReset} title="Only resets Scenario Creator fields.">
            Reset
          </button>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="flex-container page-navigation">
        <div className="flex-container">
          <div className="page-tab-buttons">
            {pages.map((page) => (
              <PageTabButton
                key={page}
                page={page}
                isActive={currentPage === page}
                onClick={() => setCurrentPage(page)}
              />
            ))}
          </div>
          <div className="button-group">
            <button className="menu_button" title="Move Page Left" onClick={handleMovePageLeft}>
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <button className="menu_button" title="Move Page Right" onClick={handleMovePageRight}>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
          <div className="button-group">
            <button
              className="menu_button primary add-question-btn"
              title="Add New Question"
              onClick={handleAddQuestion}
            >
              <i className="fa-solid fa-plus"></i> Question
            </button>
            <button className="menu_button primary" title="Add New Page" onClick={handleAddPage}>
              <i className="fa-solid fa-plus"></i> Page
            </button>
            <button className="menu_button danger" title="Remove Current Page" onClick={handleRemovePage}>
              <i className="fa-solid fa-trash"></i> Page
            </button>
          </div>
        </div>
      </div>

      {/* Questions Container */}
      <div className="questions-container">
        <div className="flex-container">
          <div className="questions-tabs">
            {questions
              .filter((question) => question.page === currentPage)
              .map((question) => (
                <QuestionTabButton
                  key={question.id}
                  inputId={question.inputId}
                  onSelect={() => {
                    handleTabClick(`question-${question.id}`);
                  }}
                  onRemove={() => {
                    const updatedQuestions = questions.filter((q) => q.id !== question.id);
                    let newTab = activeTab;

                    if (activeTab === `question-${question.id}`) {
                      // Find questions in the same page after removal
                      const questionsInPage = updatedQuestions.filter((q) => q.page === question.page);
                      if (questionsInPage.length > 0) {
                        // Switch to the first question in the page
                        newTab = `question-${questionsInPage[0].id}`;
                      } else {
                        // If no questions left in the page, switch to nothing
                        newTab = '';
                      }
                    }

                    setQuestions(updatedQuestions);
                    setActiveTab(newTab);

                    saveQuestionChanges(
                      updatedQuestions,
                      newTab.startsWith('question-')
                        ? `question-${updatedQuestions.find((q) => q.id === newTab.replace('question-', ''))?.inputId || ''}`
                        : newTab,
                    );
                  }}
                  className={activeTab === `question-${question.id}` ? 'active' : ''}
                />
              ))}
          </div>
          {activeTab.startsWith('question-') && (
            <div className="button-group">
              <div style={{ display: 'flex' }}>
                <button className="menu_button" title="Move Question Left" onClick={handleMoveQuestionLeft}>
                  <i className="fa-solid fa-arrow-left"></i>
                </button>
                <button className="menu_button" title="Move Question Right" onClick={handleMoveQuestionRight}>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
              <div>
                <select
                  className="text_pole"
                  title="Select a page to move question to"
                  onChange={(e) => handleMoveQuestionToPage(e.target.value)}
                >
                  <option value="">Select Page</option>
                  {pages.map((page) => (
                    <option key={page} value={page}>
                      Page {page}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      {['description', 'first-message', 'scenario', 'personality', 'character-note'].map((tabId) => {
        const getTabConfig = (tabId: string) => {
          const configs = {
            description: {
              type: 'description' as const,
              contentLabel: 'Character description',
              contentPlaceholder: 'Enter character description',
              content: description,
              onContentChange: setDescription,
              script: descriptionScript,
              onScriptChange: setDescriptionScript,
              previewContent: descriptionPreview,
              setPreviewContent: setDescriptionPreview,
            },
            'first-message': {
              type: 'first-message' as const,
              contentLabel: 'First Message',
              contentPlaceholder: 'Enter first message',
              content: firstMessage,
              onContentChange: setFirstMessage,
              script: firstMessageScript,
              onScriptChange: setFirstMessageScript,
              previewContent: firstMessagePreview,
              setPreviewContent: setFirstMessagePreview,
            },
            scenario: {
              type: 'scenario' as const,
              contentLabel: 'Scenario',
              contentPlaceholder: 'Enter scenario',
              content: scenario,
              onContentChange: setScenario,
              script: scenarioScript,
              onScriptChange: setScenarioScript,
              previewContent: scenarioPreview,
              setPreviewContent: setScenarioPreview,
            },
            personality: {
              type: 'personality' as const,
              contentLabel: 'Personality',
              contentPlaceholder: 'Enter personality',
              content: personality,
              onContentChange: setPersonality,
              script: personalityScript,
              onScriptChange: setPersonalityScript,
              previewContent: personalityPreview,
              setPreviewContent: setPersonalityPreview,
            },
            'character-note': {
              type: 'character-note' as const,
              contentLabel: 'Character Note',
              contentPlaceholder: 'Enter character note',
              content: characterNote,
              onContentChange: setCharacterNote,
              script: characterNoteScript,
              onScriptChange: setCharacterNoteScript,
              previewContent: characterNotePreview,
              setPreviewContent: setCharacterNotePreview,
            },
          };
          return configs[tabId as keyof typeof configs];
        };

        const config = getTabConfig(tabId);
        if (!config) return null;

        return (
          activeTab === tabId && (
            <TabContent
              key={tabId}
              type={config.type}
              contentLabel={config.contentLabel}
              contentPlaceholder={config.contentPlaceholder}
              content={config.content}
              onContentChange={config.onContentChange}
              script={config.script}
              onScriptChange={config.onScriptChange}
              previewContent={config.previewContent}
              onRefreshPreview={() => {
                const values = scriptInputValues[tabId as keyof ScriptInputValues];
                if (typeof values === 'object' && !('question' in values)) {
                  updatePreview(
                    values as Record<string, string>,
                    config.script,
                    config.content,
                    config.setPreviewContent,
                  );
                }
              }}
              isAccordionOpen={tabAccordionStates[tabId]}
              onAccordionToggle={() => {
                setTabAccordionStates((prev) => ({
                  ...prev,
                  [tabId]: !prev[tabId],
                }));
              }}
              scriptInputs={{
                inputs: questions.map(questionMappers.toScriptInput),
                values: scriptInputValues,
                onChange: (inputId, value) => {
                  const newScriptInputValues = {
                    ...scriptInputValues,
                    [tabId]: {
                      ...scriptInputValues[tabId as keyof typeof scriptInputValues],
                      [inputId]: value as string,
                    },
                  };
                  setScriptInputValues(newScriptInputValues);
                },
              }}
            />
          )
        );
      })}

      {activeTab.startsWith('question-') && (
        <div className="question-editor">
          {questions.map((question) => {
            const questionId = `question-${question.id}`;
            return (
              questionId === activeTab && (
                <QuestionComponent
                  key={question.id}
                  id={question.id}
                  type={question.type}
                  onTypeChange={(value) => {
                    setQuestions(
                      questions.map((q) => (q.id === question.id ? { ...q, type: value as QuestionType } : q)),
                    );
                  }}
                  inputId={question.inputId}
                  onInputIdChange={(value) => {
                    if (!value) {
                      stEcho('warning', 'Question ID cannot be empty.');
                      return;
                    }
                    const existingIds = questions.map((q) => q.inputId);
                    if (existingIds.includes(value)) {
                      stEcho('warning', `Question ID "${value}" already exists.`);
                      return;
                    }
                    setQuestions(questions.map((q) => (q.id === question.id ? { ...q, inputId: value } : q)));
                  }}
                  question={question.question}
                  onQuestionChange={(value) => {
                    setQuestions(questions.map((q) => (q.id === question.id ? { ...q, question: value } : q)));
                  }}
                  mainScript={question.mainScript}
                  onMainScriptChange={(value) => {
                    setQuestions(questions.map((q) => (q.id === question.id ? { ...q, mainScript: value } : q)));
                  }}
                  showScript={question.showScript}
                  onShowScriptChange={(value) => {
                    setQuestions(questions.map((q) => (q.id === question.id ? { ...q, showScript: value } : q)));
                  }}
                  showPreview={question.showPreview}
                  questionPreview={question.questionPreview}
                  isRequired={question.isRequired}
                  onRequiredChange={(value) => {
                    setQuestions(questions.map((q) => (q.id === question.id ? { ...q, isRequired: value } : q)));
                  }}
                  options={question.options}
                  onOptionsChange={(options) => {
                    setQuestions(questions.map((q) => (q.id === question.id ? { ...q, options } : q)));
                  }}
                  defaultValue={question.defaultValue}
                  onDefaultValueChange={(value) => {
                    setQuestions(questions.map((q) => (q.id === question.id ? { ...q, defaultValue: value } : q)));
                  }}
                  isDefaultChecked={question.isDefaultChecked}
                  onDefaultCheckedChange={(value) => {
                    setQuestions(questions.map((q) => (q.id === question.id ? { ...q, isDefaultChecked: value } : q)));
                  }}
                  isAccordionOpen={questionAccordionStates[question.id] ?? false}
                  onAccordionToggle={() => {
                    setQuestionAccordionStates((prev) => ({
                      ...prev,
                      [question.id]: !prev[question.id],
                    }));
                  }}
                  onRefreshPreview={async () => {
                    const newPreview = await updatePreview(
                      scriptInputValues.question[question.inputId],
                      question.mainScript,
                      question.question,
                    );
                    const newShowPreview = await updateShowScriptPreview(
                      scriptInputValues.question[question.inputId],
                      question.showScript,
                      question.showPreview,
                    );

                    setQuestions(
                      questions.map((q) =>
                        q.id === question.id ? { ...q, questionPreview: newPreview, showPreview: newShowPreview } : q,
                      ),
                    );
                  }}
                  scriptInputs={{
                    inputs: questions
                      .filter((q) => q.inputId !== question.inputId)
                      .map((q) => questionMappers.toScriptInput(q)),
                    values: scriptInputValues,
                    onChange: (inputId, value) => {
                      const newScriptInputValues = {
                        ...scriptInputValues,
                        question: {
                          ...scriptInputValues.question,
                          [question.inputId]: {
                            ...scriptInputValues.question[question.inputId],
                            [inputId]: value as string,
                          },
                        },
                      };
                      setScriptInputValues(newScriptInputValues);
                    },
                  }}
                />
              )
            );
          })}
        </div>
      )}
    </div>
  );
};
