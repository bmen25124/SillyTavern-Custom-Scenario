import { executeScript, interpolateText } from './utils.js';
import { renderExtensionTemplateAsync, extensionTemplateFolder, callGenericPopup, POPUP_TYPE } from './config.js';

export async function prepareSettings() {
    const settingsHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'settings'));
    $('#extensions_settings').append(settingsHtml);
}

export async function prepareCharacterSidebar() {
    const characterSidebarIconHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'character-sidebar-icon'));
    $('.form_create_bottom_buttons_block').prepend(characterSidebarIconHtml);
    const characterSidebarIcon = $('#character-sidebar-icon');

    characterSidebarIcon.on('click', handleCharacterSidebarClick);
}

async function handleCharacterSidebarClick() {
    let formElement = $('#form_create');
    if (formElement.length === 0) {
        return;
    }
    formElement = formElement.get(0);

    const formData = new FormData(formElement);
    const scenarioCreateDialogHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-create-dialog', {
        description: formData.get('description'),
        first_message: formData.get('first_mes'),
    }));
    callGenericPopup(scenarioCreateDialogHtml, POPUP_TYPE.TEXT, '', { okButton: true, cancelButton: true });

    setupPopupHandlers();
}

function setupPopupHandlers() {
    const popup = $('#scenario-create-dialog');
    let questionCounter = 1;

    setupPreviewFunctionality(popup);
    setupTabFunctionality(popup);
    setupAccordion(popup);
    setupDynamicInputs(popup, questionCounter);
}

function setupPreviewFunctionality(popup) {
    const refreshPreviewBtn = popup.find('#refresh-preview');
    const descriptionTextarea = popup.find('#scenario-creator-character-description');
    const scriptTextarea = popup.find('#scenario-creator-script');
    const previewDiv = popup.find('#description-preview');

    refreshPreviewBtn.on('click', () => updatePreview(popup));
}

function updatePreview(popup) {
    const descriptionTextarea = popup.find('#scenario-creator-character-description');
    const scriptTextarea = popup.find('#scenario-creator-script');
    const previewDiv = popup.find('#description-preview');

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

function setupTabFunctionality(popup) {
    function switchTab(tabId) {
        popup.find('.tab-button').removeClass('active');
        popup.find('.tab-content').removeClass('active');
        popup.find(`.tab-button[data-tab="${tabId}"]`).addClass('active');
        popup.find(`.tab-content[data-tab="${tabId}"]`).addClass('active');
    }

    popup.on('click', '.tab-button', function () {
        switchTab($(this).data('tab'));
    });

    // Initial state
    switchTab('description');
}

function setupAccordion(popup) {
    const accordion = popup.find('.accordion');
    const accordionToggle = popup.find('.accordion-toggle');

    accordionToggle.on('click', function () {
        accordion.toggleClass('open');
    });

    // Start with accordion open
    accordion.addClass('open');
}

function setupDynamicInputs(popup, questionCounter) {
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

        setupInputTypeChangeHandler(newInput);
        setupAddOptionButton(newInput, popup);
        setupScriptInputsUpdateHandlers(newInput, popup);
        setupRemoveButton(dynamicTabButtons.find('.tab-button-container:last'), popup);

        dynamicTabButtons.append(tabHtml);
        dynamicInputsContainer.append(newInput);
        questionCounter++;

        // Switch to new tab
        switchTab(`question-${id}`);
    });
}

function setupInputTypeChangeHandler(newInput) {
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
}

function setupAddOptionButton(newInput, popup) {
    newInput.find('.add-option-btn').on('click', function () {
        const optionsList = $(this).closest('.select-options-container').find('.options-list');
        const optionTemplate = popup.find('#select-option-template').html();
        const newOption = $(optionTemplate);
        const selectDefault = $(this).closest('.dynamic-input-group').find('.select-default');

        setupOptionHandlers(newOption, optionsList, selectDefault);
        optionsList.append(newOption);
    });
}

function setupOptionHandlers(newOption, optionsList, selectDefault) {
    newOption.find('.option-value, .option-label').on('input', function () {
        updateDefaultOptions(optionsList, selectDefault);
    });

    newOption.find('.remove-option-btn').on('click', function () {
        $(this).closest('.option-item').remove();
        updateDefaultOptions(optionsList, selectDefault);
    });
}

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

function setupScriptInputsUpdateHandlers(newInput, popup) {
    newInput.find('.input-id, .input-type-select').on('change', () => updateScriptInputs(popup));
    newInput.find('.input-default, .input-default-checkbox, .select-default').on('change', () => updateScriptInputs(popup));
}

function updateScriptInputs(popup) {
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
    updatePreview(popup);
}

function setupRemoveButton(tabContainer, popup) {
    tabContainer.find('.remove-input-btn').on('click', function () {
        const tabId = tabContainer.find('.tab-button').data('tab');
        tabContainer.remove();
        popup.find(`.tab-content[data-tab="${tabId}"]`).remove();
        updateScriptInputs(popup);
        switchTab('description');
    });
}

function switchTab(tabId) {
    const popup = $('#scenario-create-dialog');
    popup.find('.tab-button').removeClass('active');
    popup.find('.tab-content').removeClass('active');
    popup.find(`.tab-button[data-tab="${tabId}"]`).addClass('active');
    popup.find(`.tab-content[data-tab="${tabId}"]`).addClass('active');
}
