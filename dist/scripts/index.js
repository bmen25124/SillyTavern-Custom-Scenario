// import { SlashCommandParser } from '../../../../../slash-commands/SlashCommandParser.js';
// import { SlashCommand } from '../../../../../slash-commands/SlashCommand.js';
import { renderExtensionTemplateAsync } from '../../../../../extensions.js';
// import { echoCallback } from '../../../../../slash-commands.js';
import { callGenericPopup, POPUP_TYPE } from '../../../../../popup.js';

const extensionName = 'scenario-creator';
const extensionTemplateFolder = `third-party/${extensionName}/templates`;

// SlashCommandParser.addCommandObject(SlashCommand.fromProps({
//     aliases: ['testalias'],
//     name: 'testname',
//     helpString: 'testhelp',
// }));

jQuery(async () => {
    await prepareSettings();
    await prepareCharacterSidebar();
});

async function prepareSettings() {
    const settingsHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'settings'));
    $('#extensions_settings').append(settingsHtml);
}

async function prepareCharacterSidebar() {
    const characterSidebarIconHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'character-sidebar-icon'));
    $('.form_create_bottom_buttons_block').prepend(characterSidebarIconHtml);
    const characterSidebarIcon = $('#character-sidebar-icon');

    characterSidebarIcon.on('click', async () => {
        let formElement = $('#form_create');
        if (formElement.length === 0) {
            // echoCallback({}, 'Character creation form not found');
            return;
        }
        formElement = formElement.get(0);

        const formData = new FormData(formElement);
        const scenarioCreateDialogHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-create-dialog', {
            description: formData.get('description'),
            first_message: formData.get('first_mes'),
        }));
        callGenericPopup(scenarioCreateDialogHtml, POPUP_TYPE.TEXT, '', { okButton: true, cancelButton: true });

        // Get the popup content element
        const popup = $('#scenario-create-dialog');
        let questionCounter = 1;

        // Add preview functionality
        const refreshPreviewBtn = popup.find('#refresh-preview');
        const descriptionTextarea = popup.find('#scenario-creator-character-description');
        const scriptTextarea = popup.find('#scenario-creator-script');
        const previewDiv = popup.find('#description-preview');

        function executeScript(script, answers) {
            // Clone answers to avoid modifying the original object
            const variables = JSON.parse(JSON.stringify(answers));

            // Create a function that returns all variables
            const scriptFunction = new Function('answers', `
                    let variables = JSON.parse('${JSON.stringify(variables)}');
                    ${script}
                    return variables;
                `);

            return scriptFunction(variables);
        }

        function interpolateText(template, variables) {
            let result = template;
            const regex = /\{\{([^}]+)\}\}/g;
            let maxIterations = 10; // Prevent infinite recursion
            let iteration = 0;

            while (result.includes('{{') && iteration < maxIterations) {
                result = result.replace(regex, (match, key) => {
                    const variable = variables[key];
                    if (variable === undefined) {
                        return match; // Keep original if variable not found
                    }
                    // Recursively interpolate if the variable contains template syntax
                    return variable.toString().includes('{{')
                        ? interpolateText(variable.toString(), variables)
                        : variable;
                });
                iteration++;
            }

            return result;
        }

        function updatePreview() {
            const description = descriptionTextarea.val();
            const script = scriptTextarea.val();

            // Collect answers from script inputs
            const answers = {};
            popup.find('.script-input-group').each(function () {
                const id = $(this).data('id');
                const type = $(this).data('type');
                switch (type) {
                    case 'checkbox':
                        answers[id] = $(this).find('input[type="checkbox"]').prop('checked');
                        break;
                    case 'select':
                        answers[id] = $(this).find('select').val();
                        break;
                    default:
                        answers[id] = $(this).find('input[type="text"]').val();
                        break;
                }
            });

            try {
                // Execute script if exists
                const variables = script ? executeScript(script, answers) : answers;

                // Interpolate description with variables
                const interpolated = interpolateText(description, variables);
                previewDiv.text(interpolated);
            } catch (error) {
                console.error('Preview update/script execute error:', error);
                previewDiv.text(`Preview update/script execute error: ${error.message}`);
            }
        }

        refreshPreviewBtn.on('click', updatePreview);

        // Setup tab functionality
        function switchTab(tabId) {
            popup.find('.tab-button').removeClass('active');
            popup.find('.tab-content').removeClass('active');
            popup.find(`.tab-button[data-tab="${tabId}"]`).addClass('active');
            popup.find(`.tab-content[data-tab="${tabId}"]`).addClass('active');
        }

        // Setup accordion
        const accordion = popup.find('.accordion');
        const accordionToggle = popup.find('.accordion-toggle');

        accordionToggle.on('click', function () {
            accordion.toggleClass('open');
        });

        // Initial states
        switchTab('description');
        accordion.addClass('open'); // Start with accordion open

        // Tab click handlers
        popup.on('click', '.tab-button', function () {
            switchTab($(this).data('tab'));
        });

        // Setup dynamic inputs
        const addInputBtn = popup.find('#add-input-btn');
        const dynamicInputsContainer = popup.find('#dynamic-inputs-container');
        const dynamicTabButtons = popup.find('#dynamic-tab-buttons');
        const inputTemplate = popup.find('#dynamic-input-template');
        const tabButtonTemplate = popup.find('#tab-button-template');

        addInputBtn.on('click', () => {
            const id = Date.now(); // Unique ID for the tab
            const tabHtml = tabButtonTemplate.html()
                .replace(/{id}/g, id)
                .replace(/{number}/g, questionCounter);

            const newInput = $(inputTemplate.html().replace(/{id}/g, id));

            // Setup input type change handler
            newInput.find('.input-type-select').on('change', function () {
                const container = $(this).closest('.dynamic-input-group');
                const selectOptionsContainer = container.find('.select-options-container');
                const defaultValueContainer = container.find('.default-value-container');
                const textareaDefault = defaultValueContainer.find('.input-default');
                const checkboxDefault = defaultValueContainer.find('.checkbox-default');
                const selectDefault = defaultValueContainer.find('.select-default');

                switch ($(this).val()) {
                    case 'select':
                        selectOptionsContainer.show();
                        defaultValueContainer.show();
                        textareaDefault.hide();
                        checkboxDefault.hide();
                        selectDefault.show();
                        break;
                    case 'checkbox':
                        selectOptionsContainer.hide();
                        defaultValueContainer.show();
                        textareaDefault.hide();
                        checkboxDefault.show();
                        selectDefault.hide();
                        break;
                    default: // textarea
                        selectOptionsContainer.hide();
                        defaultValueContainer.show();
                        textareaDefault.show();
                        checkboxDefault.hide();
                        selectDefault.hide();
                        break;
                }
            });

            // Setup add option button
            newInput.find('.add-option-btn').on('click', function () {
                const optionsList = $(this).closest('.select-options-container').find('.options-list');
                const optionTemplate = popup.find('#select-option-template').html();
                const newOption = $(optionTemplate);
                const selectDefault = $(this).closest('.dynamic-input-group').find('.select-default');

                // Setup option change handlers
                newOption.find('.option-value, .option-label').on('input', function () {
                    updateDefaultOptions(optionsList, selectDefault);
                });

                newOption.find('.remove-option-btn').on('click', function () {
                    $(this).closest('.option-item').remove();
                    updateDefaultOptions(optionsList, selectDefault);
                });

                optionsList.append(newOption);
            });

            function updateDefaultOptions(optionsList, selectDefault) {
                // Store current selection
                const currentValue = selectDefault.val();

                // Clear existing options except the placeholder
                selectDefault.find('option:not(:first)').remove();

                // Add new options
                optionsList.find('.option-item').each(function () {
                    const value = $(this).find('.option-value').val();
                    const label = $(this).find('.option-label').val();
                    if (value && label) {
                        selectDefault.append(`<option value="${value}">${label}</option>`);
                    }
                });

                // Restore previous selection if it still exists
                if (selectDefault.find(`option[value="${currentValue}"]`).length) {
                    selectDefault.val(currentValue);
                }
            }

            // Update script inputs when a new question is added
            function updateScriptInputs() {
                const scriptInputsContainer = popup.find('#script-inputs-container');
                scriptInputsContainer.empty();

                popup.find('.dynamic-input-group').each(function () {
                    const id = $(this).find('.input-id').val();
                    if (!id) return;

                    const type = $(this).find('.input-type-select').val();
                    let defaultValue;
                    switch (type) {
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

                    const inputGroup = $(`
                        <div class="script-input-group" data-id="${id}" data-type="${type}">
                            <label for="script-input-${id}">${id}:</label>
                            ${type === 'checkbox'
                            ? `<input type="checkbox" id="script-input-${id}" class="text_pole" ${defaultValue ? 'checked' : ''}>`
                            : type === 'select'
                                ? `<select id="script-input-${id}" class="text_pole">
                                        ${$(this).find('.select-default').html()}
                                       </select>`
                                : `<input type="text" id="script-input-${id}" class="text_pole" value="${defaultValue || ''}">`
                        }
                        </div>
                    `);

                    scriptInputsContainer.append(inputGroup);

                    // Set the select value after appending
                    if (type === 'select') {
                        inputGroup.find('select').val(defaultValue);
                    }
                });

                // Update preview after updating inputs
                updatePreview();
            }

            dynamicTabButtons.append(tabHtml);
            dynamicInputsContainer.append(newInput);
            questionCounter++;

            // Update script inputs when input ID or type changes
            newInput.find('.input-id, .input-type-select').on('change', updateScriptInputs);
            newInput.find('.input-default, .input-default-checkbox, .select-default').on('change', updateScriptInputs);

            // Setup remove button
            const tabContainer = dynamicTabButtons.find(`.tab-button-container:last`);
            tabContainer.find('.remove-input-btn').on('click', function () {
                const tabId = tabContainer.find('.tab-button').data('tab');
                tabContainer.remove();
                popup.find(`.tab-content[data-tab="${tabId}"]`).remove();
                updateScriptInputs();
                switchTab('description');
            });

            // Switch to new tab
            switchTab(`question-${id}`);
        });
    });
}
