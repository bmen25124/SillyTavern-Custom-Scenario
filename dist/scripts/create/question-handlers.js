import { uuidv4 } from '../config.js';
import { setupOptionHandlers, setupAddOptionButton, updateDefaultOptions } from './option-handlers.js';
import { updateQuestionScriptInputs } from './script-handlers.js';
import { updateQuestionPreview } from './preview-handlers.js';
import { getScenarioDataFromUI, saveScenarioData } from './data-handlers.js';
import { switchTab } from './tab-handlers.js';

/**
 * Sets up change handler for input type selection
 * @param {JQuery} newInput - The new input jQuery element
 */
function setupInputTypeChangeHandler(newInput) {
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
 * @param {JQuery} tabContainer - The tab container jQuery element
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
function setupRemoveButton(tabContainer, popup) {
    tabContainer.find('.remove-input-btn').on('click', function () {
        const tabId = tabContainer.find('.tab-button').data('tab');
        const isCurrentTabActive = tabContainer.find('.tab-button').hasClass('active');
        const isDescriptionOrFirstMessage = ['description', 'first-message'].includes(tabId);

        tabContainer.remove();
        popup.find(`.tab-content[data-tab="${tabId}"]`).remove();

        // If removing active tab that's not description/first-message, switch to description
        if (isCurrentTabActive && !isDescriptionOrFirstMessage) {
            switchTab('description');
        }
        // If removing description or first-message tab, update script inputs
        else if (isDescriptionOrFirstMessage) {
            updateScriptInputs(popup, tabId);
        }
    });
}

/**
 * Adds a question to the UI
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 * @param {import('../types.js').Question} question - The question to add
 */
export function addQuestionToUI(popup, question) {
    const dynamicInputsContainer = popup.find('#dynamic-inputs-container');
    const dynamicTabButtons = popup.find('#dynamic-tab-buttons');
    const inputTemplate = popup.find('#dynamic-input-template');
    const tabButtonTemplate = popup.find('#tab-button-template');

    const tabHtml = tabButtonTemplate.html()
        .replace(/{id}/g, question.id)
        .replace(/{number}/g, question.inputId || 'unnamed');

    const newInput = $(inputTemplate.html().replace(/{id}/g, question.id));

    // Set values
    newInput.find('.input-id').val(question.inputId);
    newInput.find('.input-type-select').val(question.type).trigger('change');
    newInput.find('.input-question').val(question.text || '');
    newInput.find('.question-script').val(question.script || '');
    newInput.find('.input-required').prop('checked', question.required);

    // Setup question preview refresh button
    newInput.find('.refresh-question-preview').on('click', function () {
        updateQuestionPreview($(this).closest('.dynamic-input-group'));
    });

    const accordionToggles = newInput.find('.accordion-toggle');
    accordionToggles.on('click', function () {
        $(this).closest('.accordion').toggleClass('open');
    });

    switch (question.type) {
        case 'checkbox':
            newInput.find('.default-value-input-container .checkbox-default').show();
            newInput.find('.default-value-input-container textarea').hide();
            break;
        case 'select':
            const optionsList = newInput.find('.options-list');
            const selectDefault = newInput.find('.select-default');

            // Clear existing default options
            selectDefault.find('option:not(:first)').remove();

            // Add options and set up handlers
            question.options.forEach(option => {
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
            selectDefault.val(question.defaultValue);
            break;
        default:
            newInput.find('.input-default').val(question.defaultValue);
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
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
export function setupDynamicInputs(popup) {
    const addInputBtn = popup.find('#add-input-btn');

    addInputBtn.on('click', () => {
        const id = uuidv4();
        const question = {
            id,
            inputId: '',
            text: '',
            type: 'text',
            defaultValue: '',
            required: false
        };

        addQuestionToUI(popup, question);
        // Save state and switch to new tab
        const currentData = getScenarioDataFromUI(popup);
        saveScenarioData(currentData);
        switchTab(`question-${id}`);
    });
}

/**
 * Sets up update handlers for script inputs
 * @param {JQuery} newInput - The new input jQuery element
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
function setupScriptInputsUpdateHandlers(newInput, popup) {
    // Update tab name when input ID changes
    newInput.find('.input-id').on('change', function () {
        const tabId = newInput.data('tab');
        const newInputId = $(this).val() || 'unnamed';
        const tabButtonContainer = popup.find(`.tab-button-container:has(.tab-button[data-tab="${tabId}"])`);
        const tabButton = tabButtonContainer.find('.tab-button');

        // Create new tab button HTML preserving the data-tab attribute
        tabButton.html(`Question ${newInputId}`);

        // Update script inputs when ID changes
        updateQuestionScriptInputs(newInput);
    });

    // Initial script inputs setup
    updateQuestionScriptInputs(newInput);

    // Update script inputs when any question changes
    newInput.find('.input-type-select, .input-default, .input-default-checkbox, .select-default').on('change', function () {
        updateQuestionScriptInputs(newInput);
    });
}
