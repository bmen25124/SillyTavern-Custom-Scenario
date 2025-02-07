import { stEcho } from '../config';
import { CoreTab } from '../types';
import { executeMainScript, executeShowScript, interpolateText } from '../utils';
import { getScenarioCreateDataFromUI, saveScenarioCreateData } from './data-handlers';
import { checkDuplicateQuestionIds } from './question-handlers';

/**
 * Sets up preview functionality for description, first message, scenario, personality, character note
 */
export function setupPreviewFunctionality(popup: JQuery<HTMLElement>) {
  // Description preview
  const refreshPreviewBtn = popup.find('#refresh-preview');
  refreshPreviewBtn.on('click', () => updatePreview(popup, 'description'));

  // First message preview
  const refreshFirstMessagePreviewBtn = popup.find('#refresh-first-message-preview');
  refreshFirstMessagePreviewBtn.on('click', () => updatePreview(popup, 'first-message'));

  // Scenario preview
  const refreshScenarioPreviewBtn = popup.find('#refresh-scenario-preview');
  refreshScenarioPreviewBtn.on('click', () => updatePreview(popup, 'scenario'));

  // Personality preview
  const refreshPersonalityPreviewBtn = popup.find('#refresh-personality-preview');
  refreshPersonalityPreviewBtn.on('click', () => updatePreview(popup, 'personality'));

  // Character Note preview
  const refreshCharacterNotePreviewBtn = popup.find('#refresh-character-note-preview');
  refreshCharacterNotePreviewBtn.on('click', () => updatePreview(popup, 'character-note'));
}

/**
 * Updates the preview for other than question
 */
export async function updatePreview(popup: JQuery<HTMLElement>, type: CoreTab, rethrowError = false) {
  const config = {
    description: {
      contentId: '#scenario-creator-character-description',
      scriptId: '#scenario-creator-script',
      previewId: '#description-preview',
      scriptInputsId: '#script-inputs-container',
    },
    'first-message': {
      contentId: '#scenario-creator-character-first-message',
      scriptId: '#scenario-creator-first-message-script',
      previewId: '#first-message-preview',
      scriptInputsId: '#first-message-script-inputs-container',
    },
    scenario: {
      contentId: '#scenario-creator-character-scenario',
      scriptId: '#scenario-creator-scenario-script',
      previewId: '#scenario-preview',
      scriptInputsId: '#scenario-script-inputs-container',
    },
    personality: {
      contentId: '#scenario-creator-character-personality',
      scriptId: '#scenario-creator-personality-script',
      previewId: '#personality-preview',
      scriptInputsId: '#personality-script-inputs-container',
    },
    'character-note': {
      contentId: '#scenario-creator-character-note',
      scriptId: '#scenario-creator-character-note-script',
      previewId: '#character-note-preview',
      scriptInputsId: '#character-note-script-inputs-container',
    },
  };

  const { contentId, scriptId, previewId, scriptInputsId } = config[type];
  const textarea = popup.find(contentId);
  const scriptTextarea = popup.find(scriptId);
  const previewDiv = popup.find(previewId);
  const scriptInputsContainer = popup.find(scriptInputsId);

  const content = textarea.val() as string;
  const script = scriptTextarea.val() as string;

  // Collect answers from script inputs
  const answers: Record<string, string | boolean | { label: string; value: string }> = {};
  scriptInputsContainer.find('.script-input-group').each(function () {
    const id = $(this).data('id');
    const type = $(this).data('type');
    switch (type) {
      case 'checkbox':
        answers[id] = $(this).find('input[type="checkbox"]').prop('checked');
        break;
      case 'select':
        const element = $(this).find('select');
        const label = element.find('option:selected').text();
        const value = element.val() as string;
        answers[id] = { label, value };
        break;
      default:
        answers[id] = $(this).find('input[type="text"]').val() as string;
        break;
    }
  });

  const currentData = getScenarioCreateDataFromUI(popup);

  for (const [key, value] of Object.entries(answers)) {
    if (typeof value === 'object' && value.value) {
      currentData.scriptInputValues[type][key] = value.value;
    } else {
      currentData.scriptInputValues[type][key] = value.toString();
    }
  }
  saveScenarioCreateData(currentData);

  try {
    // Execute script if exists
    const variables = script ? await executeMainScript(script, answers, 'remove', currentData.worldName) : answers;

    // Interpolate content with variables
    const interpolated = interpolateText(content, variables, 'variableName');
    previewDiv.text(interpolated);
  } catch (error: any) {
    console.error('Preview update/script execute error:', error);
    previewDiv.text(`Preview update/script execute error: ${error.message}`);
    if (rethrowError) {
      throw error;
    }
  }
}

/**
 * Updates the preview for a question
 */
export async function updateQuestionPreview(
  popup: JQuery<HTMLElement>,
  questionGroup: JQuery<HTMLElement>,
  rethrowError = false,
) {
  const duplicateId = checkDuplicateQuestionIds(popup);
  if (duplicateId) {
    stEcho('error', `Question ID "${duplicateId}" already exists.`);
    return;
  }

  const questionId = questionGroup.find('.input-id').val() as string;
  const questionText = questionGroup.find('.input-question').val() as string;
  const mainScriptText = questionGroup.find('.question-script').val() as string;
  const showScriptText = questionGroup.find('.show-script').val() as string;
  const mainPreviewDiv = questionGroup.find('.question-preview');
  const showPreviewDiv = questionGroup.find('.show-preview');
  const scriptInputsContainer = questionGroup.find('.question-script-inputs-container');

  const currentData = getScenarioCreateDataFromUI(popup);

  // Collect answers from script inputs
  const answers: Record<string, string | boolean | { label: string; value: string }> = {};
  scriptInputsContainer.find('.script-input-group').each(function () {
    const id = $(this).data('id');
    const type = $(this).data('type');
    switch (type) {
      case 'checkbox':
        answers[id] = $(this).find('input[type="checkbox"]').prop('checked');
        break;
      case 'select':
        const element = $(this).find('select');
        const label = element.find('option:selected').text();
        const value = element.val() as string;
        answers[id] = { label, value };
        break;
      default:
        answers[id] = $(this).find('input[type="text"]').val() as string;
        break;
    }

    if (!currentData.scriptInputValues.question[questionId]) {
      currentData.scriptInputValues.question[questionId] = {};
    }
    let answerValue = typeof answers[id] === 'object' ? answers[id].value : answers[id].toString();
    currentData.scriptInputValues.question[questionId][id] = answerValue;
  });

  saveScenarioCreateData(currentData);

  try {
    // Execute script if exists
    const variables = mainScriptText
      ? await executeMainScript(mainScriptText, answers, 'remove', currentData.worldName)
      : answers;

    // Interpolate content with variables
    const interpolated = interpolateText(questionText, variables, 'variableName');
    mainPreviewDiv.text(interpolated);
  } catch (error: any) {
    console.error('Question preview update/script execute error:', error);
    mainPreviewDiv.text(`Question preview update/script execute error: ${error.message}`);
    if (rethrowError) {
      throw error;
    }
  }

  // Update show script preview
  try {
    // Execute script if exists
    const result = showScriptText ? executeShowScript(showScriptText, answers, 'remove', currentData.worldName) : true;
    showPreviewDiv.text(result ? 'SHOW' : 'HIDE');
  } catch (error: any) {
    console.error('Show script preview update/script execute error:', error);
    showPreviewDiv.text(`Show script preview update/script execute error: ${error.message}`);
    if (rethrowError) {
      throw error;
    }
  }
}
