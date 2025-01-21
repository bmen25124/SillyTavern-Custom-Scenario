import { renderExtensionTemplateAsync, extensionTemplateFolder, callGenericPopup, POPUP_TYPE, getCharacters, getRequestHeaders, SlashCommandParser } from './config.js';
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
                alert('Error importing scenario: ' + error.message);
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
    callGenericPopup(scenarioPlayDialogHtml, POPUP_TYPE.TEXT, '', { okButton: true, cancelButton: true });
    // Extract scenario creator data
    const { descriptionScript, firstMessageScript, questions } = scenarioData.scenario_creator || {};

    const popup = $('#scenario-play-dialog');
    const dynamicInputsContainer = popup.find('#dynamic-inputs-container');
    const inputTemplate = popup.find('#dynamic-input-template');

    // Add each question to the UI
    (questions || []).forEach(question => {
        const newInput = $(inputTemplate.html());
        newInput.find('.input-question').text(question.inputId);

        const inputContainer = newInput.find('.input-container');
        switch (question.type) {
            case 'checkbox':
                inputContainer.html(`
                    <label class="checkbox_label">
                        <input type="checkbox" class="dynamic-input" data-id="${question.inputId}"
                            ${question.defaultValue ? 'checked' : ''}>
                    </label>
                `);
                break;
            case 'select':
                const selectHtml = `
                    <select class="text_pole dynamic-input" data-id="${question.inputId}">
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
                    <input type="text" class="text_pole dynamic-input" data-id="${question.inputId}"
                        value="${question.defaultValue || ''}" placeholder="Enter your answer">
                `);
                break;
        }

        dynamicInputsContainer.append(newInput);
    });

    // Handle OK button click
    popup.closest('.popup').find('.popup-button-ok').on('click', async function () {
        const answers = {};
        popup.find('.dynamic-input').each(function () {
            const id = $(this).data('id');
            switch ($(this).attr('type')) {
                case 'checkbox':
                    answers[id] = $(this).prop('checked');
                    break;
                default:
                    answers[id] = $(this).val();
            }
        });

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
        } catch (error) {
            console.error('Error processing scenario:', error);
            alert('Error processing scenario: ' + error.message);
        }
    });
}
