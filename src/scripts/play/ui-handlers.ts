import {
  renderExtensionTemplateAsync,
  extensionTemplateFolder,
  callGenericPopup,
  POPUP_TYPE,
  POPUP_RESULT,
  st_updateCharacters,
  st_getRequestHeaders,
  stEcho,
  stGo,
  extensionVersion,
  st_getCharacters,
  st_addWorldInfo,
  st_saveCharacterDebounced,
  st_getWorldNames,
  st_setWorldInfoButtonClass,
  st_getThumbnailUrl,
  extensionName,
} from '../config';
import { upgradeOrDowngradeData, FullExportData, Question } from '../types';
import { executeMainScript, executeShowScript, interpolateText } from '../utils';
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

      let buffer: ArrayBuffer | null = null;
      let fileType: 'json' | 'png';
      if (file.type === 'image/png') {
        // Handle PNG files
        buffer = await file.arrayBuffer();
        fileType = 'png';
        const extracted = readScenarioFromPng(buffer!);
        if (!extracted) {
          await stEcho('error', 'No scenario data found in PNG file.');
          return;
        }
        scenarioData = extracted;
      } else {
        // Handle JSON files
        const text = await file.text();
        fileType = 'json';
        scenarioData = JSON.parse(text);
      }

      if (!scenarioData.scenario_creator) {
        await stEcho('warning', 'This scenario does not have a creator section');
        return;
      }

      // Check version changes
      if (scenarioData.scenario_creator.version && scenarioData.scenario_creator.version !== extensionVersion) {
        console.debug(
          `[${extensionName}] Scenario version changed from ${scenarioData.scenario_creator.version} to ${extensionVersion}`,
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
async function setupPlayDialogHandlers(scenarioData: FullExportData, buffer: ArrayBuffer | null, fileType: 'json' | 'png') {
  const scenarioPlayDialogHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-play-dialog'));
  const {
    descriptionScript,
    firstMessageScript,
    scenarioScript,
    personalityScript,
    questions: _questions,
    characterNoteScript,
  } = scenarioData.scenario_creator || {};

  let popup: JQuery<HTMLElement>;
  let dynamicInputsContainer: JQuery<HTMLElement>;
  let inputTemplate: JQuery<HTMLElement>;

  // Set up pagination variables
  let currentPageIndex = 0;
  // @ts-ignore - Already checked in upper function
  const layout = scenarioData.scenario_creator.layout || [[..._questions.map((q) => q.inputId)]];

  const sortedQuestions: Question[] = [];
  for (const questionIds of layout) {
    for (const questionId of questionIds) {
      // @ts-ignore - Already checked in upper function
      const foundQuestion = _questions.find((q) => q.inputId === questionId);
      if (foundQuestion) {
        sortedQuestions.push(foundQuestion);
      }
    }
  }

  const worldName = scenarioData.data.extensions?.world;

  callGenericPopup(scenarioPlayDialogHtml, POPUP_TYPE.TEXT, '', {
    okButton: true,
    cancelButton: true,
    wider: true,
    onClosing: async (popupInstance) => {
      if (popupInstance.result !== POPUP_RESULT.AFFIRMATIVE) {
        return true;
      }

      // Check if we are in the last page
      if (currentPageIndex < layout.length - 1) {
        await stEcho('warning', 'Please go to the last page before playing');
        return false;
      }

      // On final submission, validate all fields
      const allAnswers: Record<string, string | boolean | { label: string; value: string }> = {};
      let hasValidationErrors = false;

      popup.find('.dynamic-input').each(function () {
        const $input = $(this);
        const id = $input.data('id');
        const required = $input.data('required');
        const shouldShow = $input.data('show');
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
        if (shouldShow && required && (value === '' || value === undefined)) {
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

      if (worldName) {
        await st_addWorldInfo(worldName, scenarioData.data.character_book, false);
      }

      try {
        // Process description and first message with allAnswers
        const descriptionVars = descriptionScript
          ? await executeMainScript(descriptionScript, allAnswers, 'remove', worldName)
          : allAnswers;
        const description = interpolateText(
          scenarioData.description || scenarioData.data?.description,
          descriptionVars,
          'remove',
        );

        const firstMessageVars = firstMessageScript
          ? await executeMainScript(firstMessageScript, allAnswers, 'remove', worldName)
          : allAnswers;
        const firstMessage = interpolateText(
          scenarioData.first_mes || scenarioData.data?.first_mes,
          firstMessageVars,
          'remove',
        );

        const scenarioVars = scenarioScript
          ? await executeMainScript(scenarioScript, allAnswers, 'remove', worldName)
          : allAnswers;
        const processedScenario = interpolateText(
          scenarioData.scenario || scenarioData.data?.scenario,
          scenarioVars,
          'remove',
        );

        const personalityVars = personalityScript
          ? await executeMainScript(personalityScript, allAnswers, 'remove', worldName)
          : allAnswers;
        const processedPersonality = interpolateText(
          scenarioData.personality || scenarioData.data?.personality,
          personalityVars,
          'remove',
        );

        // Update both main and data.scenario fields
        scenarioData.scenario = processedScenario;
        scenarioData.data.scenario = processedScenario;

        // Update both main and data.personality fields
        scenarioData.personality = processedPersonality;
        scenarioData.data.personality = processedPersonality;

        // Add character note script processing and update extensions.depth_prompt.prompt
        if (scenarioData.data.extensions && scenarioData.data.extensions.depth_prompt) {
          const characterNoteVars = characterNoteScript
            ? await executeMainScript(characterNoteScript, allAnswers, 'remove', worldName)
            : allAnswers;
          const processedCharacterNote = interpolateText(
            scenarioData.data.extensions.depth_prompt.prompt,
            characterNoteVars,
            'remove',
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

        const headers = st_getRequestHeaders();
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
        const fetchBody = (await fetchResult.json()) as { file_name: string };
        await st_updateCharacters();
        if (!fetchBody.file_name) {
          await stEcho('error', 'Failed to get file name from server.');
          return false;
        }
        await stGo(`${fetchBody.file_name}.png`);

        async function updateAvatar() {
          if (fetchBody.file_name) {
            let thumbnailUrl = st_getThumbnailUrl('avatar', `${fetchBody.file_name}.png`);
            await fetch(thumbnailUrl, {
              method: 'GET',
              cache: 'no-cache',
              headers: {
                pragma: 'no-cache',
                'cache-control': 'no-cache',
              },
            });
            // Add time query to avoid caching
            thumbnailUrl += `&scenarioTime=${new Date().getTime()}`;
            $('#avatar_load_preview').attr('src', thumbnailUrl);

            $('.mes').each(function () {
              const nameMatch = $(this).attr('ch_name') === scenarioData.name;
              if ($(this).attr('is_system') == 'true' && !nameMatch) {
                return;
              }
              if ($(this).attr('is_user') == 'true') {
                return;
              }
              if (nameMatch) {
                const avatar = $(this).find('.avatar img');
                avatar.attr('src', thumbnailUrl);
              }
            });
          }
        }
        updateAvatar();

        // Activate world info
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
      if ($input.data('required') && $input.data('show')) {
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
  async function updateQuestionText(questionWrapper: JQuery<HTMLElement>, question: Question) {
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
      const variables = question.script
        ? await executeMainScript(question.script, answers, 'remove', worldName)
        : answers;
      const interpolated = interpolateText(question.text, variables, 'remove');
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
    sortedQuestions.forEach(async (question) => {
      const newInput = $(inputTemplate.html());
      newInput.addClass('dynamic-input-wrapper');
      newInput.attr('data-input-id', question.inputId);

      const inputContainer = newInput.find('.input-container');
      const inputAttrs = {
        'data-id': question.inputId,
        'data-required': question.required || false,
        'data-show': true, // Default to showing questions, will update when showScript is executed
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
      await updateQuestionText(newInput, question);

      // Update question text when any input changes
      popup.find('.dynamic-input').on('input change', function () {
        sortedQuestions.forEach(async (q) => {
          const wrapper = dynamicInputsContainer.find(`[data-input-id="${q.inputId}"]`);
          await updateQuestionText(wrapper, q);
        });
      });
    });
  }

  // Function to display current page by showing/hiding inputs
  function displayCurrentPage() {
    // Hide all inputs first
    dynamicInputsContainer.find('.dynamic-input-wrapper').hide();

    // Show only inputs for current page
    const currentPageQuestions = sortedQuestions.filter((q) => layout[currentPageIndex].includes(q.inputId));

    // Collect current answers for script execution
    const answers: Record<string, string | boolean | { label: string; value: string }> = {};
    popup.find('.dynamic-input').each(function () {
      const $input = $(this);
      const id = $input.data('id');
      if ($input.is('select')) {
        const label = $input.find('option:selected').text();
        answers[id] = { label, value: $input.val() as string };
      } else {
        answers[id] = $input.attr('type') === 'checkbox' ? $input.prop('checked') : ($input.val() as string);
      }
    });

    currentPageQuestions.forEach(async (question) => {
      const wrapper = dynamicInputsContainer.find(`[data-input-id="${question.inputId}"]`);
      const shouldShow = !question.showScript || executeShowScript(question.showScript, answers, 'remove', worldName);

      // Update the show status and display accordingly
      wrapper.find('.dynamic-input').data('show', shouldShow);
      if (shouldShow) {
        wrapper.show();
        await updateQuestionText(wrapper, question);
      }
    });

    // Update navigation
    prevButton.toggle(currentPageIndex > 0);
    nextButton.toggle(currentPageIndex < layout.length - 1);
    pageIndicator.text(`Page ${currentPageIndex + 1} of ${layout.length}`);
  }

  // Create all inputs and display first page
  createAllInputs();
  displayCurrentPage();
}
