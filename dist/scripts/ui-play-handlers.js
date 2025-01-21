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

    callGenericPopup(scenarioPlayDialogHtml, POPUP_TYPE.TEXT, '', {
        okButton: true,
        cancelButton: true,
        onClosing: async (popupInstance) => {
            if (popupInstance.result !== POPUP_RESULT.AFFIRMATIVE) {
                return true;
            }

            // Reset previous validation errors
            popup.find('.validation-error').hide();

            // Validate required fields
            const answers = {};
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

                answers[id] = value;

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
                return false;
            }

            try {
                // Process description and first message with answers
                const descriptionVars = descriptionScript ?
                    executeScript(descriptionScript, answers) : answers;
                const description = interpolateText(scenarioData.description, descriptionVars);

                const firstMessageVars = firstMessageScript ?
                    executeScript(firstMessageScript, answers) : answers;
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

    // Add each question to the UI
    (questions || []).forEach(question => {
        const newInput = $(inputTemplate.html());
        newInput.find('.input-question').text(question.inputId + (question.required ? ' *' : ''));

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
