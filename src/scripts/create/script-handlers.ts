import { CoreTab, ScriptInputValues } from '../types';
import { getScenarioCreateDataFromUI, saveScenarioCreateData } from './data-handlers';

/**
 * Sets up script input update handlers for all tabs
 */
export function updateScriptInputs(
  popup: JQuery<HTMLElement>,
  type: CoreTab,
  initialScriptInputValues?: ScriptInputValues,
) {
  const config = {
    description: {
      containerId: '#script-inputs-container',
    },
    'first-message': {
      containerId: '#first-message-script-inputs-container',
    },
    scenario: {
      containerId: '#scenario-script-inputs-container',
    },
    personality: {
      containerId: '#personality-script-inputs-container',
    },
    'character-note': {
      containerId: '#character-note-script-inputs-container',
    },
  };

  // @ts-ignore
  const container = popup.find(config[type].containerId);

  // Get current data to access saved script input values
  const currentData = getScenarioCreateDataFromUI(popup);
  currentData.scriptInputValues = initialScriptInputValues || currentData.scriptInputValues;

  // Store existing input values before emptying container
  const existingValues: Record<string, boolean | string> = {};
  container.find('.script-input-group').each(function () {
    const id = $(this).data('id');
    const inputType = $(this).data('type');
    switch (inputType) {
      case 'checkbox':
        existingValues[id] = $(this).find('input[type="checkbox"]').prop('checked');
        break;
      case 'select':
        existingValues[id] = $(this).find('select').val() as string;
        break;
      default:
        existingValues[id] = $(this).find('input[type="text"]').val() as string;
        break;
    }
  });

  container.empty();

  // Create script inputs for the specified tab
  popup.find('.dynamic-input-group').each(function () {
    const id = $(this).find('.input-id').val() as string;
    if (!id) return;

    const inputType = $(this).find('.input-type-select').val();
    let defaultValue;
    switch (inputType) {
      case 'checkbox':
        defaultValue = $(this).find('.input-default-checkbox').prop('checked');
        break;
      case 'select':
        defaultValue = $(this).find('.select-default').val();
        break;
      default:
        defaultValue = $(this).find('.input-default').val();
        break;
    }

    const helpText =
      inputType === 'select'
        ? 'Access using: variables.' + id + '.value and variables.' + id + '.label'
        : 'Access using: variables.' + id;

    const inputGroup = $(`
            <div class="script-input-group" data-id="${id}" data-type="${inputType}">
                <label for="script-input-${id}-${type}" title="${helpText}">${id}:</label>
                ${
                  inputType === 'checkbox'
                    ? `<input type="checkbox" id="script-input-${id}-${type}" class="text_pole" ${defaultValue ? 'checked' : ''} title="${helpText}">`
                    : inputType === 'select'
                      ? `<select id="script-input-${id}-${type}" class="text_pole" title="${helpText}">
                            ${$(this).find('.select-default').html()}
                           </select>`
                      : `<input type="text" id="script-input-${id}-${type}" class="text_pole" value="${defaultValue || ''}" title="${helpText}">`
                }
            </div>
        `);

    container.append(inputGroup);

    // Restore previous value if it exists, otherwise use default
    let value;
    const localValue = currentData.scriptInputValues[type]?.[id];
    const existingValue = existingValues[id];
    if (existingValue !== undefined && existingValue !== null && existingValue !== '') {
      value = existingValue;
    } else if (localValue !== undefined && localValue !== null && localValue !== '') {
      value = localValue;
    } else {
      value = defaultValue;
    }

    if (inputType === 'checkbox') {
      inputGroup.find('input[type="checkbox"]').prop('checked', value);
    } else if (inputType === 'select') {
      inputGroup.find('select').val(value);
    } else {
      inputGroup.find('input[type="text"]').val(value);
    }

    if (!currentData.scriptInputValues[type]) {
      currentData.scriptInputValues[type] = {};
    }
    currentData.scriptInputValues[type][id] = value;
  });

  // Save updated script input values
  saveScenarioCreateData(currentData);
}

/**
 * Updates script inputs for a specific question
 */
export function updateQuestionScriptInputs(
  popup: JQuery<HTMLElement>,
  questionGroup: JQuery<HTMLElement>,
  initialScriptInputValues?: ScriptInputValues,
) {
  const id = questionGroup.find('.input-id').val() as string;
  const container = questionGroup.find('.question-script-inputs-container');
  const allInputs = popup.find('.dynamic-input-group');

  // Get current data to access saved script input values
  const currentData = getScenarioCreateDataFromUI(popup);
  currentData.scriptInputValues = initialScriptInputValues || currentData.scriptInputValues;

  // Store existing values
  const existingValues: Record<string, boolean | string> = {};
  container.find('.script-input-group').each(function () {
    const id = $(this).data('id');
    const inputType = $(this).data('type');
    switch (inputType) {
      case 'checkbox':
        existingValues[id] = $(this).find('input[type="checkbox"]').prop('checked');
        break;
      case 'select':
        existingValues[id] = $(this).find('select').val() as string;
        break;
      default:
        existingValues[id] = $(this).find('input[type="text"]').val() as string;
        break;
    }
  });

  container.empty();

  // Add script inputs for all questions except self
  allInputs.each(function () {
    const currentQuestionInputId = $(this).find('.input-id').val() as string;
    if (currentQuestionInputId === id) {
      return; // Skip self to avoid circular reference
    }

    const inputType = $(this).find('.input-type-select').val();
    let defaultValue;
    switch (inputType) {
      case 'checkbox':
        defaultValue = $(this).find('.input-default-checkbox').prop('checked');
        break;
      case 'select':
        defaultValue = $(this).find('.select-default').val();
        break;
      default:
        defaultValue = $(this).find('.input-default').val();
        break;
    }

    const helpText =
      inputType === 'select'
        ? 'Access using: variables.' +
          currentQuestionInputId +
          '.value and variables.' +
          currentQuestionInputId +
          '.label'
        : 'Access using: variables.' + currentQuestionInputId;
    const inputGroup = $(`
            <div class="script-input-group" data-id="${currentQuestionInputId}" data-type="${inputType}">
                <label for="script-input-${currentQuestionInputId}-${currentQuestionInputId}" title="${helpText}">${currentQuestionInputId}:</label>
                ${
                  inputType === 'checkbox'
                    ? `<input type="checkbox" id="script-input-${currentQuestionInputId}-${currentQuestionInputId}" class="text_pole" ${defaultValue ? 'checked' : ''} title="${helpText}">`
                    : inputType === 'select'
                      ? `<select id="script-input-${currentQuestionInputId}-${currentQuestionInputId}" class="text_pole" title="${helpText}">
                               ${$(this).find('.select-default').html()}
                           </select>`
                      : `<input type="text" id="script-input-${currentQuestionInputId}-${currentQuestionInputId}" class="text_pole" value="${defaultValue || ''}" title="${helpText}">`
                }
            </div>
        `);

    container.append(inputGroup);

    // Restore previous value if it exists, otherwise use default
    let value;
    const localValue = currentData.scriptInputValues.question[id]?.[currentQuestionInputId];
    const existingValue = existingValues[currentQuestionInputId];
    if (existingValue !== undefined && existingValue !== null && existingValue !== '') {
      value = existingValue;
    } else if (localValue !== undefined && localValue !== null && localValue !== '') {
      value = localValue;
    } else {
      value = defaultValue;
    }

    if (inputType === 'checkbox') {
      inputGroup.find('input[type="checkbox"]').prop('checked', value);
    } else if (inputType === 'select') {
      inputGroup.find('select').val(value);
    } else {
      inputGroup.find('input[type="text"]').val(value);
    }

    if (!currentData.scriptInputValues.question[id]) {
      currentData.scriptInputValues.question[id] = {};
    }
    currentData.scriptInputValues.question[id][currentQuestionInputId] = value;
  });

  // Save updated script input values
  saveScenarioCreateData(currentData);
}
