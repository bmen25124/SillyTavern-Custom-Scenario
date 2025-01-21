// import { SlashCommandParser } from '../../../../../../public/scripts/slash-commands/SlashCommandParser.js';
// import { SlashCommand } from '../../../../../../public/scripts/slash-commands/SlashCommand.js';
import { renderExtensionTemplateAsync } from '../../../../../../public/scripts/extensions.js';
// import { echoCallback } from '../../../../../../public/scripts/slash-commands.js';
import { callGenericPopup, POPUP_TYPE } from '../../../../../../public/scripts/popup.js';

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

        // Setup tab functionality
        function switchTab(tabId) {
            popup.find('.tab-button').removeClass('active');
            popup.find('.tab-content').removeClass('active');
            popup.find(`.tab-button[data-tab="${tabId}"]`).addClass('active');
            popup.find(`.tab-content[data-tab="${tabId}"]`).addClass('active');
        }

        // Initial tab
        switchTab('description');

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

            dynamicTabButtons.append(tabHtml);
            dynamicInputsContainer.append(newInput);
            questionCounter++;

            // Setup remove button
            const tabContainer = dynamicTabButtons.find(`.tab-button-container:last`);
            tabContainer.find('.remove-input-btn').on('click', function () {
                const tabId = tabContainer.find('.tab-button').data('tab');
                tabContainer.remove();
                popup.find(`.tab-content[data-tab="${tabId}"]`).remove();
                switchTab('description');
            });

            // Switch to new tab
            switchTab(`question-${id}`);
        });
    });
}
