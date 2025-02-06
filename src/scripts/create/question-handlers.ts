import { setupOptionHandlers, setupAddOptionButton, updateDefaultOptions } from './option-handlers';
import { updateQuestionScriptInputs, updateScriptInputs } from './script-handlers';
import { updateQuestionPreview } from './preview-handlers';
import { getScenarioCreateDataFromUI, saveScenarioCreateData } from './data-handlers';
import { getCurrentPage, switchTab } from './tab-handlers';
import { Question } from '../types';
import { stEcho } from '../config';

/**
 * Sets up change handler for input type selection
 */
function setupInputTypeChangeHandler(newInput: JQuery<HTMLElement>) {
  newInput.find('.input-type-select').on('change', function () {
    const container = $(this).closest('.dynamic-input-group');
    const selectOptionsContainer = container.find('.select-options-container');
    const defaultValueContainer = container.find('.default-value-container');
    const textDefault = defaultValueContainer.find('.input-default');
    const checkboxDefault = defaultValueContainer.find('.checkbox-default');
    const selectDefault = defaultValueContainer.find('.select-default');

    switch ($(this).val()) {
      case 'select':
        selectOptionsContainer.show();
        defaultValueContainer.show();
        textDefault.hide();
        checkboxDefault.hide();
        selectDefault.show();
        break;
      case 'checkbox':
        selectOptionsContainer.hide();
        defaultValueContainer.show();
        textDefault.hide();
        checkboxDefault.show();
        selectDefault.hide();
        break;
      default: // text
        selectOptionsContainer.hide();
        defaultValueContainer.show();
        textDefault.show();
        checkboxDefault.hide();
        selectDefault.hide();
        break;
    }
  });
}

/**
 * Sets up functionality for removing questions
 */
export function setupRemoveButton(tabContainer: JQuery<HTMLElement>, popup: JQuery<HTMLElement>) {
  tabContainer.find('.remove-input-btn').on('click', function () {
    const tabId = tabContainer.find('.tab-button').data('tab');
    const isCurrentTabActive = tabContainer.find('.tab-button').hasClass('active');
    const isNotQuestion = ['description', 'first-message', 'scenario', 'personality', 'character-note'].includes(tabId);

    tabContainer.remove();
    popup.find(`.tab-content[data-tab="${tabId}"]`).remove();

    // If removing active tab that's not question, switch to description
    if (isCurrentTabActive && !isNotQuestion) {
      switchTab(popup, 'description');
    }
    // If not a question tab, update script inputs
    else if (isNotQuestion) {
      updateScriptInputs(popup, tabId);
    }
  });
}

/**
 * Adds a question to the UI
 */
export function addQuestionToUI(popup: JQuery<HTMLElement>, question: Question) {
  const dynamicInputsContainer = popup.find('#dynamic-inputs-container');
  const dynamicTabButtons = popup.find('#dynamic-tab-buttons');
  const inputTemplate = popup.find('#dynamic-input-template');
  const tabButtonTemplate = popup.find('#tab-button-template');

  const tabHtml = tabButtonTemplate
    .html()
    .replace(/{id}/g, question.inputId)
    .replace(/{page}/g, getCurrentPage().toString());

  const newInput = $(inputTemplate.html().replace(/{id}/g, question.inputId));

  // Set values
  newInput.find('.input-id').val(question.inputId);
  newInput.find('.input-type-select').val(question.type).trigger('change');
  newInput.find('.input-question').val(question.text || '');
  newInput.find('.question-script').val(question.script || '');
  newInput.find('.show-script').val(question.showScript || '');
  newInput.find('.input-required').prop('checked', question.required);

  // Setup question preview refresh button
  newInput.find('.refresh-question-preview').on('click', function () {
    updateQuestionPreview(popup, $(this).closest('.dynamic-input-group'));
  });

  const accordionToggles = newInput.find('.accordion-toggle');
  accordionToggles.on('click', function () {
    $(this).closest('.accordion').toggleClass('open');
  });

  switch (question.type) {
    case 'checkbox':
      newInput.find('.default-value-input-container textarea').hide();
      const checkboxDefault = newInput.find('.default-value-input-container .checkbox-default');
      checkboxDefault.find('input').prop('checked', question.defaultValue);
      checkboxDefault.show();
      break;
    case 'select':
      const optionsList = newInput.find('.options-list');
      const selectDefault = newInput.find('.select-default') as JQuery<HTMLSelectElement>;

      // Clear existing default options
      selectDefault.find('option:not(:first)').remove();

      // Add options and set up handlers
      question.options?.forEach((option) => {
        const optionTemplate = popup.find('#select-option-template').html();
        const newOption = $(optionTemplate);
        newOption.find('.option-value').val(option.value);
        newOption.find('.option-label').val(option.label);
        optionsList.append(newOption);

        // Add option to select default
        if (option.value && option.label) {
          selectDefault.append(`<option value="${option.value}">${option.label}</option>`);
        }

        // Set up handlers after the option is in DOM
        setupOptionHandlers(newOption, optionsList, selectDefault);
      });

      newInput.find('.select-options-container').show();
      newInput.find('.default-value-input-container select').show();
      newInput.find('.default-value-input-container textarea').hide();

      // Set default value after all options are added
      selectDefault.val(question.defaultValue as string);
      break;
    default:
      newInput.find('.input-default').val(question.defaultValue as string);
  }

  setupInputTypeChangeHandler(newInput);
  setupAddOptionButton(newInput, popup);
  setupScriptInputsUpdateHandlers(newInput, popup);

  dynamicTabButtons.append(tabHtml);
  dynamicInputsContainer.append(newInput);

  setupRemoveButton(dynamicTabButtons.find('.tab-button-container:last'), popup);
}

/**
 * Sets up dynamic input functionality
 */
export function setupDynamicInputs(popup: JQuery<HTMLElement>) {
  const addInputBtn = popup.find('#add-question-btn');

  addInputBtn.on('click', () => {
    let idNumber = 1;
    while (popup.find(`.dynamic-input-group[data-tab="question-id_${idNumber}"]`).length > 0) {
      idNumber++;
    }
    const question: Question = {
      inputId: `id_${idNumber}`,
      text: '',
      type: 'text',
      defaultValue: '',
      script: '',
      required: true,
      showScript: '',
    };

    addQuestionToUI(popup, question);
    switchTab(popup, `question-${question.inputId}`);
  });
}

/**
 * Sets up update handlers for script inputs
 */
function setupScriptInputsUpdateHandlers(newInput: JQuery<HTMLElement>, popup: JQuery<HTMLElement>) {
  // Update tab name when input ID changes
  newInput.find('.input-id').on('change', async function () {
    const tabId = newInput.data('tab') as string;
    const tabButtonContainer = popup.find(`.tab-button-container:has(.tab-button[data-tab="${tabId}"])`);
    const tabButton = tabButtonContainer.find('.tab-button');

    const oldInputId = tabId.replace('question-', '');
    const newInputId = $(this).val();
    if (!newInputId) {
      await stEcho('error', 'Question ID cannot be empty.');
      $(this).val(oldInputId);
      return;
    }

    const idExists = popup.find(`.dynamic-input-group[data-tab="question-${newInputId}"]`).length > 0;
    if (idExists) {
      await stEcho('error', `Question ID "${newInputId}" already exists.`);
      $(this).val(oldInputId);
      return;
    }

    // Update tab name
    tabButton.html(`Question ${newInputId}`);

    // Update tab data
    tabButton.data('tab', `question-${newInputId}`).attr('data-tab', `question-${newInputId}`);

    // Update input group
    popup
      .find(`.dynamic-input-group[data-tab="${tabId}"]`)
      .attr('data-tab', `question-${newInputId}`)
      .data('tab', `question-${newInputId}`);

    // Update script inputs when ID changes
    updateQuestionScriptInputs(popup, newInput);
  });

  // Initial script inputs setup
  updateQuestionScriptInputs(popup, newInput);

  // Update script inputs when any question changes
  newInput
    .find('.input-type-select, .input-default, .input-default-checkbox, .select-default')
    .on('change', function () {
      updateQuestionScriptInputs(popup, newInput);
    });
}

export function checkDuplicateQuestionIds(popup: JQuery<HTMLElement>): string | null {
  const uniqueIdMap = new Map<string, number>();
  let hasDuplicate = false;
  let duplicateId = '';
  popup.find('.dynamic-input-group').each(function () {
    const group = $(this);
    const inputId = group.find('.input-id').val() as string;
    if (inputId && uniqueIdMap.has(inputId)) {
      hasDuplicate = true;
      duplicateId = inputId;
      return false; // Break the loop
    }
    uniqueIdMap.set(inputId, 1);
  });

  if (hasDuplicate) {
    stEcho('error', `Question ID "${duplicateId}" already exists.`);
    return duplicateId;
  }

  return null;
}
