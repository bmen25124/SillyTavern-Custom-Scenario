import { renderExtensionTemplateAsync, extensionTemplateFolder, callGenericPopup, POPUP_TYPE, POPUP_RESULT, getCharacters, getRequestHeaders, SlashCommandParser } from './config.js';
import { executeScript, interpolateText } from './utils.js';

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
    const fileInput = $('<input type="file" accept=".json" style="display: none">');
    $('body').append(fileInput);

    // Handle file selection
    fileInput.on('change', async function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const scenarioData = JSON.parse(event.target.result);
                setupPlayDialogHandlers(scenarioData);
            } catch (error) {
                console.error('Import error:', error);
                SlashCommandParser.commands['echo'].callback({ severity: 'error' }, 'Error importing scenario: ' + error.message);
            }
        };
        reader.readAsText(file);

        // Clean up
        fileInput.remove();
    });

    // Trigger file picker
    fileInput.trigger('click');
}

/**
 * Sets up handlers for the play dialog
 * @param {Object} scenarioData - The scenario data
 */
async function setupPlayDialogHandlers(scenarioData) {
    if (!scenarioData.scenario_creator) {
        await SlashCommandParser.commands['echo'].callback({ severity: 'warning' }, 'This scenario does not have a creator section');
        return
    }

    const scenarioPlayDialogHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-play-dialog'));
    const { descriptionScript, firstMessageScript, questions } = scenarioData.scenario_creator || {};

    /**
     * @type {JQuery<HTMLElement>}
     */
    let popup;
    /**
     * @type {JQuery<HTMLElement>}
     */
    let dynamicInputsContainer;
    /**
     * @type {JQuery<HTMLElement>}
     */
    let inputTemplate;

    // Set up pagination variables
    let currentPageIndex = 0;
    const layout = scenarioData.scenario_creator.layout || [[...questions.map(q => q.inputId)]];
    const visitedPages = new Set([0]); // Track visited pages, starting with first page

    callGenericPopup(scenarioPlayDialogHtml, POPUP_TYPE.TEXT, '', {
        okButton: true,
        cancelButton: true,
        wider: true,
        onClosing: async (popupInstance) => {
            if (popupInstance.result !== POPUP_RESULT.AFFIRMATIVE) {
                return true;
            }

            // Check if all pages have been visited before allowing cancel
            if (visitedPages.size < layout.length) {
                await SlashCommandParser.commands['echo'].callback({ severity: 'warning' }, 'Please view all pages before playing');
                return false;
            }

            // On final submission, validate all fields
            const allAnswers = {};
            let hasValidationErrors = false;

            popup.find('.dynamic-input').each(function () {
                const $input = $(this);
                const id = $input.data('id');
                const required = $input.data('required');
                let value;

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
                    $input.closest('.dynamic-input-group')
                        .find('.validation-error')
                        .text('This field is required')
                        .show();
                }
            });

            if (hasValidationErrors) {
                // Find first page with validation error
                for (let i = 0; i < layout.length; i++) {
                    const inputIds = layout[i];
                    const hasError = inputIds.some(inputId => {
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
                const descriptionVars = descriptionScript ?
                    executeScript(descriptionScript, allAnswers) : allAnswers;
                const description = interpolateText(scenarioData.description, descriptionVars);

                const firstMessageVars = firstMessageScript ?
                    executeScript(firstMessageScript, allAnswers) : allAnswers;
                const firstMessage = interpolateText(scenarioData.first_mes, firstMessageVars);

                // Create form data for character creation
                const formData = new FormData();
                scenarioData.description = description;
                scenarioData.first_mes = firstMessage;
                scenarioData.data.description = description;
                scenarioData.data.first_mes = firstMessage;
                const newFile = new Blob([JSON.stringify(scenarioData)], { type: 'application/json' });
                formData.append('avatar', newFile, 'scenario.json');
                formData.append('file_type', 'json');

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
                await getCharacters();
                SlashCommandParser.commands['go'].callback(undefined, scenarioData.name);
                return true;
            } catch (error) {
                console.error('Error processing scenario:', error);
                await SlashCommandParser.commands['echo'].callback({ severity: 'error' }, 'Error processing scenario: ' + error.message);
                return false;
            }
        }
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
        const currentPageInputs = popup.find('.dynamic-input').filter((_, el) =>
            layout[currentPageIndex].includes($(el).data('id'))
        );

        currentPageInputs.each(function () {
            const $input = $(this);
            if ($input.data('required')) {
                let value;
                switch ($input.attr('type')) {
                    case 'checkbox':
                        value = $input.prop('checked');
                        break;
                    default:
                        value = $input.val();
                }

                if (value === '' || value === undefined) {
                    hasPageErrors = true;
                    $input.closest('.dynamic-input-group')
                        .find('.validation-error')
                        .text('This field is required')
                        .show();
                }
            }
        });

        return !hasPageErrors;
    }

    // Function to handle page navigation
    function navigateToPage(targetIndex) {
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

    // Create all inputs at initialization
    function createAllInputs() {
        questions.forEach(question => {
            const newInput = $(inputTemplate.html());
            newInput.find('.input-question').text(question.text + (question.required ? ' *' : ''));
            newInput.addClass('dynamic-input-wrapper');
            newInput.attr('data-input-id', question.inputId);

            const inputContainer = newInput.find('.input-container');
            const inputAttrs = {
                'data-id': question.inputId,
                'data-required': question.required || false
            };

            switch (question.type) {
                case 'checkbox':
                    inputContainer.html(`
                    <label class="checkbox_label">
                        <input type="checkbox" class="dynamic-input"
                            ${Object.entries(inputAttrs).map(([key, val]) => `${key}="${val}"`).join(' ')}
                            ${question.defaultValue ? 'checked' : ''}>
                    </label>
                `);
                    break;
                case 'select':
                    const selectHtml = `
                    <select class="text_pole dynamic-input"
                        ${Object.entries(inputAttrs).map(([key, val]) => `${key}="${val}"`).join(' ')}>
                        ${question.options.map(opt =>
                        `<option value="${opt.value}" ${opt.value === question.defaultValue ? 'selected' : ''}>
                                ${opt.label}
                            </option>`
                    ).join('')}
                    </select>
                `;
                    inputContainer.html(selectHtml);
                    break;
                default: // text
                    inputContainer.html(`
                    <input type="text" class="text_pole dynamic-input"
                        ${Object.entries(inputAttrs).map(([key, val]) => `${key}="${val}"`).join(' ')}
                        value="${question.defaultValue || ''}"
                        placeholder="${question.required ? 'Required' : 'Enter your answer'}">
                `);
                    break;
            }

            dynamicInputsContainer.append(newInput);
        });
    }

    // Function to display current page by showing/hiding inputs
    function displayCurrentPage() {
        // Hide all inputs first
        dynamicInputsContainer.find('.dynamic-input-wrapper').hide();

        // Show only inputs for current page
        const currentPageQuestions = questions.filter(q => layout[currentPageIndex].includes(q.inputId));
        currentPageQuestions.forEach(question => {
            dynamicInputsContainer.find(`[data-input-id="${question.inputId}"]`).show();
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
