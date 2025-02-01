import {
  renderExtensionTemplateAsync,
  extensionTemplateFolder,
  callGenericPopup,
  POPUP_TYPE,
  POPUP_RESULT,
  st_getCharacters,
  getRequestHeaders,
  stEcho,
  stGo,
  extensionVersion,
} from '../config';
import { upgradeOrDowngradeData, FullExportData, Question } from '../types';
import { executeScript, interpolateText } from '../utils';
import { readScenarioFromPng, writeScenarioToPng } from '../utils/png-handlers';

/**
 * Prepares and adds the play scenario button to the character sidebar
 */
export async function preparePlayButton() {
  const playScenarioIconHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-play-icon'));
  $('#form_character_search_form').prepend(playScenarioIconHtml);
  const playScenarioIcon = $('#scenario-play-icon');
  playScenarioIcon.on('click', handlePlayScenarioClick);
}

/**
 * Handles click on the play scenario icon
 * Opens file picker to load and play a scenario
 */
export async function handlePlayScenarioClick() {
  // Create hidden file input
  const fileInput: JQuery<HTMLInputElement> = $('<input type="file" accept=".json, .png" style="display: none">');
  $('body').append(fileInput);

  // Handle file selection
  fileInput.on('change', async function (e: JQuery.ChangeEvent) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      let scenarioData: FullExportData;

      let buffer: ArrayBuffer;
      let fileType: 'json' | 'png';
      if (file.type === 'image/png') {
        // Handle PNG files
        buffer = await file.arrayBuffer();
        fileType = 'png';
        const extracted = readScenarioFromPng(buffer);
        if (!extracted) {
          await stEcho('error', 'No scenario data found in PNG file.');
          return;
        }
        scenarioData = extracted;
      } else {
        // Handle JSON files
        const text = await file.text();
        buffer = new TextEncoder().encode(text);
        fileType = 'json';
        scenarioData = JSON.parse(text);
      }

      if (!scenarioData.scenario_creator) {
        await stEcho('warning', 'This scenario does not have a creator section');
        return;
      }

      // Check version changes
      if (scenarioData.scenario_creator.version && scenarioData.scenario_creator.version !== extensionVersion) {
        await stEcho(
          'info',
          `Scenario version changed from ${scenarioData.scenario_creator.version} to ${extensionVersion}`,
        );
      }

      scenarioData.scenario_creator = upgradeOrDowngradeData(scenarioData.scenario_creator, 'export');
      setupPlayDialogHandlers(scenarioData, buffer, fileType);
    } catch (error: any) {
      console.error('Import error:', error);
      await stEcho('error', 'Error importing scenario: ' + error.message);
    }

    // Clean up
    fileInput.remove();
  });

  // Trigger file picker
  fileInput.trigger('click');
}

/**
 * Sets up handlers for the play dialog
 */
async function setupPlayDialogHandlers(scenarioData: FullExportData, buffer: ArrayBuffer, fileType: 'json' | 'png') {
  const scenarioPlayDialogHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-play-dialog'));
  const { descriptionScript, firstMessageScript, scenarioScript, personalityScript, questions, characterNoteScript } =
    scenarioData.scenario_creator || {};

  let popup: JQuery<HTMLElement>;
  let dynamicInputsContainer: JQuery<HTMLElement>;
  let inputTemplate: JQuery<HTMLElement>;

  // Set up pagination variables
  let currentPageIndex = 0;
  const layout = scenarioData.scenario_creator.layout || [[...questions.map((q) => q.inputId)]];
  const visitedPages = new Set([0]); // Track visited pages, starting with first page

  callGenericPopup(scenarioPlayDialogHtml, POPUP_TYPE.TEXT, '', {
    okButton: true,
    cancelButton: true,
    wider: true,
    onClosing: async (popupInstance: { result: POPUP_RESULT }) => {
      if (popupInstance.result !== POPUP_RESULT.AFFIRMATIVE) {
        return true;
      }

      // Check if all pages have been visited before allowing cancel
      if (visitedPages.size < layout.length) {
        await stEcho('warning', 'Please view all pages before playing');
        return false;
      }

      // On final submission, validate all fields
      const allAnswers: Record<string, string | boolean | { label: string; value: string }> = {};
      let hasValidationErrors = false;

      popup.find('.dynamic-input').each(function () {
        const $input = $(this);
        const id = $input.data('id');
        const required = $input.data('required');
        let value;

        // Handle select elements first
        if ($input.is('select')) {
          const label = $input.find('option:selected').text();
          value = { label, value: $input.val() };
        }
        // Then handle other input types
        else
          switch ($input.attr('type')) {
            case 'checkbox':
              value = $input.prop('checked');
              break;
            default:
              value = $input.val();
          }

        allAnswers[id] = value;

        // Check if required field is empty
        if (required && (value === '' || value === undefined)) {
          hasValidationErrors = true;
          $input.closest('.dynamic-input-group').find('.validation-error').text('This field is required').show();
        }
      });

      if (hasValidationErrors) {
        // Find first page with validation error
        for (let i = 0; i < layout.length; i++) {
          const inputIds = layout[i];
          const hasError = inputIds.some((inputId) => {
            const wrapper = popup.find(`[data-input-id="${inputId}"]`);
            return wrapper.find('.validation-error:visible').length > 0;
          });
          if (hasError) {
            currentPageIndex = i;
            displayCurrentPage();
            break;
          }
        }
        return false;
      }

      try {
        // Process description and first message with allAnswers
        const descriptionVars = descriptionScript ? executeScript(descriptionScript, allAnswers) : allAnswers;
        const description = interpolateText(scenarioData.description || scenarioData.data?.description, descriptionVars);

        const firstMessageVars = firstMessageScript ? executeScript(firstMessageScript, allAnswers) : allAnswers;
        const firstMessage = interpolateText(scenarioData.first_mes || scenarioData.data?.first_mes, firstMessageVars);

        const scenarioVars = scenarioScript ? executeScript(scenarioScript, allAnswers) : allAnswers;
        const processedScenario = interpolateText(scenarioData.scenario || scenarioData.data?.scenario, scenarioVars);

        const personalityVars = personalityScript ? executeScript(personalityScript, allAnswers) : allAnswers;
        const processedPersonality = interpolateText(scenarioData.personality || scenarioData.data?.personality, personalityVars);

        // Update both main and data.scenario fields
        scenarioData.scenario = processedScenario;
        scenarioData.data.scenario = processedScenario;

        // Update both main and data.personality fields
        scenarioData.personality = processedPersonality;
        scenarioData.data.personality = processedPersonality;

        // Add character note script processing and update extensions.depth_prompt.prompt
        if (scenarioData.data.extensions && scenarioData.data.extensions.depth_prompt) {
          const characterNoteVars = characterNoteScript ? executeScript(characterNoteScript, allAnswers) : allAnswers;
          const processedCharacterNote = interpolateText(
            scenarioData.data.extensions.depth_prompt.prompt,
            characterNoteVars,
          );
          scenarioData.data.extensions.depth_prompt.prompt = processedCharacterNote;
        }

        // Create form data for character creation
        const formData = new FormData();
        scenarioData.description = description;
        scenarioData.first_mes = firstMessage;
        scenarioData.data.description = description;
        scenarioData.data.first_mes = firstMessage;

        if (fileType === 'png' && buffer) {
          // For PNG, create a new buffer with new scenario data
          const newBuffer = writeScenarioToPng(buffer, scenarioData);
          const newFile = new Blob([newBuffer], {
            type: 'image/png',
          });
          formData.append('avatar', newFile, 'scenario.png');
          formData.append('file_type', 'png');
        } else {
          // For JSON, use the standard JSON format
          const newFile = new Blob([JSON.stringify(scenarioData)], {
            type: 'application/json',
          });
          formData.append('avatar', newFile, 'scenario.json');
          formData.append('file_type', 'json');
        }

        const headers = getRequestHeaders();
        delete headers['Content-Type'];
        const fetchResult = await fetch('/api/characters/import', {
          method: 'POST',
          headers: headers,
          body: formData,
          cache: 'no-cache',
        });
        if (!fetchResult.ok) {
          throw new Error('Fetch result is not ok');
        }
        await st_getCharacters();
        await stGo(scenarioData.name);
        return true;
      } catch (error: any) {
        console.error('Error processing scenario:', error);
        await stEcho('error', 'Error processing scenario: ' + error.message);
        return false;
      }
    },
  });

  popup = $('#scenario-play-dialog');
  dynamicInputsContainer = popup.find('#dynamic-inputs-container');
  inputTemplate = popup.find('#dynamic-input-template');

  // Create navigation buttons
  const navigationButtons = $(`
        <div class="flex-container justifySpaceBetween">
            <button id="prev-page" class="menu_button" style="display: none">Previous</button>
            <div id="page-indicator"></div>
            <button id="next-page" class="menu_button">Next</button>
        </div>
    `);
  dynamicInputsContainer.before(navigationButtons);

  // Navigation button handlers
  const prevButton = navigationButtons.find('#prev-page');
  const nextButton = navigationButtons.find('#next-page');
  const pageIndicator = navigationButtons.find('#page-indicator');

  // Function to validate current page
  function validateCurrentPage() {
    popup.find('.validation-error').hide();
    let hasPageErrors = false;
    const currentPageInputs = popup
      .find('.dynamic-input')
      .filter((_, el) => layout[currentPageIndex].includes($(el).data('id')));

    currentPageInputs.each(function () {
      const $input = $(this);
      if ($input.data('required')) {
        let value;
        // Handle select elements first
        if ($input.is('select')) {
          value = $input.val();
        }
        // Then handle other input types
        else
          switch ($input.attr('type')) {
            case 'checkbox':
              value = $input.prop('checked');
              break;
            default:
              value = $input.val();
          }

        if (value === '' || value === undefined) {
          hasPageErrors = true;
          $input.closest('.dynamic-input-group').find('.validation-error').text('This field is required').show();
        }
      }
    });

    return !hasPageErrors;
  }

  // Function to handle page navigation
  function navigateToPage(targetIndex: number) {
    if (targetIndex >= 0 && targetIndex < layout.length) {
      if (targetIndex > currentPageIndex && !validateCurrentPage()) {
        return;
      }
      currentPageIndex = targetIndex;
      displayCurrentPage();
    }
  }

  prevButton.on('click', () => navigateToPage(currentPageIndex - 1));
  nextButton.on('click', () => navigateToPage(currentPageIndex + 1));

  /**
   * Updates the question text based on dynamic input values and script execution.
   * @throws {Error} When script execution fails
   */
  function updateQuestionText(questionWrapper: JQuery<HTMLElement>, question: Question) {
    const answers: Record<string, string | boolean | { label: string; value: string }> = {};
    popup.find('.dynamic-input').each(function () {
      const $input = $(this);
      const id = $input.data('id');
      // Handle select elements first
      if ($input.is('select')) {
        const label = $input.find('option:selected').text();
        answers[id] = { label, value: $input.val() as string };
      }
      // Then handle other input types
      else
        switch ($input.attr('type')) {
          case 'checkbox':
            answers[id] = $input.prop('checked');
            break;
          default:
            answers[id] = $input.val() as string | boolean;
        }
    });

    try {
      const variables = question.script ? executeScript(question.script, answers) : answers;
      const interpolated = interpolateText(question.text, variables);
      questionWrapper.find('.input-question').text(interpolated + (question.required ? ' *' : ''));
    } catch (error: any) {
      console.error('Question text update error:', error);
      questionWrapper
        .find('.input-question')
        .text(question.text + (question.required ? ' *' : '') + ` (Script error: ${error.message})`);
    }
  }

  // Create all inputs at initialization
  function createAllInputs() {
    questions.forEach((question) => {
      const newInput = $(inputTemplate.html());
      newInput.addClass('dynamic-input-wrapper');
      newInput.attr('data-input-id', question.inputId);

      const inputContainer = newInput.find('.input-container');
      const inputAttrs = {
        'data-id': question.inputId,
        'data-required': question.required || false,
      };

      switch (question.type) {
        case 'checkbox':
          inputContainer.html(`
                    <label class="checkbox_label">
                        <input type="checkbox" class="dynamic-input"
                            ${Object.entries(inputAttrs)
                              .map(([key, val]) => `${key}="${val}"`)
                              .join(' ')}
                            ${question.defaultValue ? 'checked' : ''}>
                    </label>
                `);
          break;
        case 'select':
          const selectHtml = `
                    <select class="text_pole dynamic-input"
                        ${Object.entries(inputAttrs)
                          .map(([key, val]) => `${key}="${val}"`)
                          .join(' ')}>
                        ${question
                          .options!.map(
                            (opt) =>
                              `<option value="${opt.value}" ${opt.value === question.defaultValue ? 'selected' : ''}>${opt.label}</option>`,
                          )
                          .join('')}
                    </select>
                `;
          inputContainer.html(selectHtml);
          break;
        default: // text
          inputContainer.html(`
                    <input type="text" class="text_pole dynamic-input"
                        ${Object.entries(inputAttrs)
                          .map(([key, val]) => `${key}="${val}"`)
                          .join(' ')}
                        value="${question.defaultValue || ''}"
                        placeholder="${question.required ? 'Required' : 'Enter your answer'}">
                `);
          break;
      }

      dynamicInputsContainer.append(newInput);

      // Set initial question text
      updateQuestionText(newInput, question);

      // Update question text when any input changes
      popup.find('.dynamic-input').on('input change', function () {
        questions.forEach((q) => {
          const wrapper = dynamicInputsContainer.find(`[data-input-id="${q.inputId}"]`);
          updateQuestionText(wrapper, q);
        });
      });
    });
  }

  // Function to display current page by showing/hiding inputs
  function displayCurrentPage() {
    // Hide all inputs first
    dynamicInputsContainer.find('.dynamic-input-wrapper').hide();

    // Show only inputs for current page
    const currentPageQuestions = questions.filter((q) => layout[currentPageIndex].includes(q.inputId));
    currentPageQuestions.forEach((question) => {
      const wrapper = dynamicInputsContainer.find(`[data-input-id="${question.inputId}"]`);
      wrapper.show();
      updateQuestionText(wrapper, question);
    });

    // Update navigation and track visited pages
    visitedPages.add(currentPageIndex);
    prevButton.toggle(currentPageIndex > 0);
    nextButton.toggle(currentPageIndex < layout.length - 1);
    pageIndicator.text(`Page ${currentPageIndex + 1} of ${layout.length}`);
  }

  // Create all inputs and display first page
  createAllInputs();
  displayCurrentPage();
}
