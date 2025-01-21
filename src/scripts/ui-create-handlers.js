import { executeScript, interpolateText } from './utils.js';
import { renderExtensionTemplateAsync, extensionTemplateFolder, callGenericPopup, POPUP_TYPE, uuidv4, humanizedDateTime } from './config.js';
import { STORAGE_KEY, createEmptyScenarioData } from './types.js';

/**
 * Creates a production-ready version of scenario data without internal state
 * @param {import('./types.js').ScenarioData} data - The full scenario data
 * @param {FormData} formData - The form data from the character creation form
 * @returns {Object} Clean scenario data for production use
 */
function createProductionScenarioData(data, formData) {
    const { descriptionScript, firstMessageScript, questions, description, firstMessage } = data;
    const formEntries = Array.from(formData.entries());
    let jsonData;

    // Extract json_data
    for (const [key, value] of formEntries) {
        if (key === 'json_data') {
            jsonData = JSON.parse(value);
            break;
        }
    }

    if (!jsonData) {
        throw new Error('json_data not found in form data');
    }

    // Create scenario creator specific data
    const scenarioCreator = {
        descriptionScript,
        firstMessageScript: firstMessageScript || '',
        questions: questions.map(({ id, inputId, type, defaultValue, options }) => ({
            id,
            inputId,
            type,
            defaultValue,
            ...(options && { options })
        }))
    };

    // Return the final production data format
    return {
        name: jsonData.name,
        description: description,
        personality: jsonData.personality || '',
        scenario: jsonData.scenario,
        first_mes: firstMessage,
        mes_example: jsonData.mes_example || '',
        creatorcomment: jsonData.creatorcomment || '',
        avatar: jsonData.avatar || 'none',
        chat: jsonData.chat,
        talkativeness: jsonData.talkativeness || '0.5',
        fav: jsonData.fav || false,
        tags: jsonData.tags || [],
        spec: jsonData.spec || 'chara_card_v3',
        spec_version: jsonData.spec_version || '3.0',
        data: {
            name: jsonData.data.name,
            description: description,
            personality: jsonData.data.personality || '',
            scenario: jsonData.data.scenario,
            first_mes: firstMessage,
            mes_example: jsonData.data.mes_example || '',
            creator_notes: jsonData.data.creator_notes || '',
            system_prompt: jsonData.data.system_prompt || '',
            post_history_instructions: jsonData.data.post_history_instructions || '',
            tags: jsonData.data.tags || [],
            creator: jsonData.data.creator || '',
            character_version: jsonData.data.character_version || '',
            alternate_greetings: jsonData.data.alternate_greetings || [],
            extensions: jsonData.data.extensions,
            group_only_greetings: jsonData.data.group_only_greetings || []
        },
        create_date: humanizedDateTime(),
        scenario_creator: scenarioCreator
    };
}

/**
 * Triggers download of scenario data as a JSON file
 * @param {Object} data - The data to download
 * @param {string} filename - The name of the file to download
 */
function downloadScenarioData(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


/**
 * Loads scenario data from local storage
 * @returns {import('./types.js').ScenarioData} The loaded scenario data or empty data if none exists
 */
function loadScenarioData() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : createEmptyScenarioData();
}

/**
 * Saves scenario data to local storage
 * @param {import('./types.js').ScenarioData} data - The scenario data to save
 */
function saveScenarioData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Extracts current scenario data from the UI
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 * @returns {import('./types.js').ScenarioData} The current scenario data
 */
function getScenarioDataFromUI(popup) {
    const data = createEmptyScenarioData();

    data.description = popup.find('#scenario-creator-character-description').val() || '';
    data.descriptionScript = popup.find('#scenario-creator-script').val() || '';
    data.firstMessage = popup.find('#scenario-creator-character-first-message').val() || '';
    data.firstMessageScript = popup.find('#scenario-creator-first-message-script').val() || '';
    data.activeTab = popup.find('.tab-button.active').data('tab') || 'description';

    // Get questions data
    data.questions = [];
    popup.find('.dynamic-input-group').each(function () {
        const question = {
            id: $(this).data('tab').replace('question-', ''),
            inputId: $(this).find('.input-id').val(),
            type: $(this).find('.input-type-select').val(),
            defaultValue: ''
        };

        switch (question.type) {
            case 'checkbox':
                question.defaultValue = $(this).find('.input-default-checkbox').prop('checked');
                break;
            case 'select':
                question.defaultValue = $(this).find('.select-default').val();
                question.options = [];
                $(this).find('.option-item').each(function () {
                    question.options.push({
                        value: $(this).find('.option-value').val(),
                        label: $(this).find('.option-label').val()
                    });
                });
                break;
            default:
                question.defaultValue = $(this).find('.input-default').val();
        }

        data.questions.push(question);
    });

    return data;
}

/**
 * Applies scenario data to the UI
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 * @param {import('./types.js').ScenarioData} data - The scenario data to apply
 */
function applyScenarioDataToUI(popup, data) {
    popup.find('#scenario-creator-character-description').val(data.description);
    popup.find('#scenario-creator-script').val(data.descriptionScript);
    popup.find('#scenario-creator-character-first-message').val(data.firstMessage);
    popup.find('#scenario-creator-first-message-script').val(data.firstMessageScript);

    // Restore questions
    data.questions.forEach(question => {
        addQuestionToUI(popup, question);
    });


    // Switch to active tab
    switchTab(data.activeTab);

    // Update previews
    updatePreview(popup, 'description');
    updatePreview(popup, 'first-message');
}

/**
 * Prepares and appends the settings HTML to the extensions settings section
 */
export async function prepareSettings() {
    const settingsHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'settings'));
    $('#extensions_settings').append(settingsHtml);
}

/**
 * Prepares and adds the character sidebar icon with click handler
 */
export async function prepareCharacterSidebar() {
    const characterSidebarIconHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'character-sidebar-icon'));
    $('.form_create_bottom_buttons_block').prepend(characterSidebarIconHtml);
    const characterSidebarIcon = $('#character-sidebar-icon');

    characterSidebarIcon.on('click', handleCharacterSidebarClick);
}

/**
 * Handles click on the character sidebar icon
 * Creates the scenario creator dialog and loads saved data
 */
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

    // Load saved data after popup is created
    const popup = $('#scenario-create-dialog');
    const savedData = loadScenarioData();
    if (!savedData.description) {
        savedData.description = formData.get('description');
    }
    if (!savedData.firstMessage) {
        savedData.firstMessage = formData.get('first_mes');
    }

    applyScenarioDataToUI(popup, savedData);
}

/**
 * Sets up all event handlers for the scenario creator popup
 */
function setupPopupHandlers() {
    const popup = $('#scenario-create-dialog');

    setupPreviewFunctionality(popup);
    setupTabFunctionality(popup);
    setupAccordion(popup);
    setupDynamicInputs(popup);
    setupExportButton(popup);
    setupImportButton(popup);
}

/**
 * Sets up the import button functionality
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
function setupImportButton(popup) {
    // Create hidden file input
    const fileInput = $('<input type="file" accept=".json" style="display: none">');
    popup.append(fileInput);

    // Handle import button click
    popup.find('#import-scenario-btn').on('click', function () {
        fileInput.click();
    });

    // Handle file selection
    fileInput.on('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const importedData = JSON.parse(event.target.result);
                const scenarioData = convertImportedData(importedData);

                // Clear existing data
                popup.find('#dynamic-tab-buttons').empty();
                popup.find('#dynamic-inputs-container').empty();

                // Apply imported data
                applyScenarioDataToUI(popup, scenarioData);

                // Save imported data
                saveScenarioData(scenarioData);
            } catch (error) {
                console.error('Import error:', error);
                alert('Error importing file: ' + error.message);
            }
        };
        reader.readAsText(file);

        // Reset file input for future imports
        fileInput.val('');
    });
}

/**
 * Converts imported data to the correct format with internal state
 * @param {Object} importedData - The imported scenario data
 * @returns {import('./types.js').ScenarioData} Converted scenario data
 */
function convertImportedData(importedData) {
    // Extract scenario creator specific data
    const scenarioCreator = importedData.scenario_creator || {};

    return {
        description: importedData.description || '',
        descriptionScript: scenarioCreator.descriptionScript || '',
        firstMessage: importedData.first_mes || '',
        firstMessageScript: scenarioCreator.firstMessageScript || '',
        questions: (scenarioCreator.questions || []).map(q => ({
            ...q,
            id: q.id || uuidv4()
        })),
        activeTab: 'description'
    };
}

/**
 * Sets up the export button functionality
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
function setupExportButton(popup) {
    popup.find('#export-scenario-btn').on('click', function () {
        const currentData = getScenarioDataFromUI(popup);
        const formElement = $('#form_create').get(0);
        const formData = new FormData(formElement);
        const productionData = createProductionScenarioData(currentData, formData);
        downloadScenarioData(productionData, 'scenario.json');
    });
}

/**
 * Sets up preview functionality for description and first message
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
function setupPreviewFunctionality(popup) {
    // Description preview
    const refreshPreviewBtn = popup.find('#refresh-preview');
    refreshPreviewBtn.on('click', () => updatePreview(popup, 'description'));

    // First message preview
    const refreshFirstMessagePreviewBtn = popup.find('#refresh-first-message-preview');
    refreshFirstMessagePreviewBtn.on('click', () => updatePreview(popup, 'first-message'));
}

/**
 * Updates the preview for description or first message
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 * @param {'description'|'first-message'} type - The type of preview to update
 */
function updatePreview(popup, type) {
    const isDescription = type === 'description';
    const textarea = popup.find(isDescription ? '#scenario-creator-character-description' : '#scenario-creator-character-first-message');
    const scriptTextarea = popup.find(isDescription ? '#scenario-creator-script' : '#scenario-creator-first-message-script');
    const previewDiv = popup.find(isDescription ? '#description-preview' : '#first-message-preview');
    const scriptInputsContainer = popup.find(isDescription ? '#script-inputs-container' : '#first-message-script-inputs-container');

    const content = textarea.val();
    const script = scriptTextarea.val();

    // Collect answers from script inputs
    const answers = {};
    scriptInputsContainer.find('.script-input-group').each(function () {
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

        // Interpolate content with variables
        const interpolated = interpolateText(content, variables);
        previewDiv.text(interpolated);
    } catch (error) {
        console.error('Preview update/script execute error:', error);
        previewDiv.text(`Preview update/script execute error: ${error.message}`);
    }
}

/**
 * Sets up tab switching functionality with auto-save
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
function setupTabFunctionality(popup) {
    popup.on('click', '.tab-button', function () {
        const tabId = $(this).data('tab');
        // Save current state before switching tabs
        const currentData = getScenarioDataFromUI(popup);
        saveScenarioData(currentData);

        switchTab(tabId);
    });

    // Initial state
    switchTab('description');
}

/**
 * Sets up accordion functionality
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
function setupAccordion(popup) {
    const accordions = popup.find('.accordion');
    const accordionToggles = popup.find('.accordion-toggle');

    accordionToggles.on('click', function () {
        $(this).closest('.accordion').toggleClass('open');
    });

    // Start with accordions open
    accordions.addClass('open');
}

/**
 * Adds a question to the UI
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 * @param {import('./types.js').Question} question - The question to add
 */
function addQuestionToUI(popup, question) {
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

    switch (question.type) {
        case 'checkbox':
            newInput.find('.input-default-checkbox').prop('checked', question.defaultValue);
            break;
        case 'select':
            const optionsList = newInput.find('.options-list');
            const selectDefault = newInput.find('.select-default');
            question.options.forEach(option => {
                const optionTemplate = popup.find('#select-option-template').html();
                const newOption = $(optionTemplate);
                newOption.find('.option-value').val(option.value);
                newOption.find('.option-label').val(option.label);
                setupOptionHandlers(newOption, optionsList, selectDefault);
                optionsList.append(newOption);
            });
            updateDefaultOptions(optionsList, selectDefault);
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
function setupDynamicInputs(popup) {
    const addInputBtn = popup.find('#add-input-btn');
    const dynamicInputsContainer = popup.find('#dynamic-inputs-container');
    const dynamicTabButtons = popup.find('#dynamic-tab-buttons');
    const inputTemplate = popup.find('#dynamic-input-template');
    const tabButtonTemplate = popup.find('#tab-button-template');

    addInputBtn.on('click', () => {
        const id = uuidv4();
        const question = {
            id,
            inputId: '',
            type: 'text',
            defaultValue: ''
        };

        addQuestionToUI(popup, question);
        // Save state and switch to new tab
        const currentData = getScenarioDataFromUI(popup);
        saveScenarioData(currentData);
        switchTab(`question-${id}`);
    });
}

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
 * Sets up functionality for adding options to select inputs
 * @param {JQuery} newInput - The new input jQuery element
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
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

/**
 * Sets up handlers for select options
 * @param {JQuery} newOption - The new option jQuery element
 * @param {JQuery} optionsList - The options list jQuery element
 * @param {JQuery} selectDefault - The select default jQuery element
 */
function setupOptionHandlers(newOption, optionsList, selectDefault) {
    newOption.find('.option-value, .option-label').on('input', function () {
        updateDefaultOptions(optionsList, selectDefault);
    });

    newOption.find('.remove-option-btn').on('click', function () {
        $(this).closest('.option-item').remove();
        updateDefaultOptions(optionsList, selectDefault);
    });
}

/**
 * Updates the default options for a select input
 * @param {JQuery} optionsList - The options list jQuery element
 * @param {JQuery} selectDefault - The select default jQuery element
 */
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

/**
 * Sets up update handlers for script inputs
 * @param {JQuery} newInput - The new input jQuery element
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
function setupScriptInputsUpdateHandlers(newInput, popup) {
    // Update script inputs when values change
    newInput.find('.input-id, .input-type-select').on('change', () => updateScriptInputs(popup));
    newInput.find('.input-default, .input-default-checkbox, .select-default').on('change', () => updateScriptInputs(popup));

    // Update tab name when input ID changes
    newInput.find('.input-id').on('change', function () {
        const tabId = newInput.data('tab');
        const newInputId = $(this).val() || 'unnamed';
        const tabButtonContainer = popup.find(`.tab-button-container:has(.tab-button[data-tab="${tabId}"])`);
        const tabButton = tabButtonContainer.find('.tab-button');
        const removeButton = tabButtonContainer.find('.remove-input-btn');

        // Create new tab button HTML preserving the data-tab attribute
        tabButton.html(`Question ${newInputId}`);
    });
}

/**
 * Updates script inputs for both description and first message
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
function updateScriptInputs(popup) {
    const scriptInputsContainer = popup.find('#script-inputs-container');
    const firstMessageScriptInputsContainer = popup.find('#first-message-script-inputs-container');
    scriptInputsContainer.empty();
    firstMessageScriptInputsContainer.empty();

    // Create script inputs for both description and first message
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

        // Add to both containers
        scriptInputsContainer.append(inputGroup.clone());
        firstMessageScriptInputsContainer.append(inputGroup.clone());

        // Set the select value after appending for both
        if (type === 'select') {
            scriptInputsContainer.find(`select#script-input-${id}`).val(defaultValue);
            firstMessageScriptInputsContainer.find(`select#script-input-${id}`).val(defaultValue);
        }
    });

    // Update both previews after updating inputs
    updatePreview(popup, 'description');
    updatePreview(popup, 'first-message');
}

/**
 * Sets up functionality for removing questions
 * @param {JQuery} tabContainer - The tab container jQuery element
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
function setupRemoveButton(tabContainer, popup) {
    tabContainer.find('.remove-input-btn').on('click', function () {
        const tabId = tabContainer.find('.tab-button').data('tab');
        tabContainer.remove();
        popup.find(`.tab-content[data-tab="${tabId}"]`).remove();
        updateScriptInputs(popup);
        switchTab('description');
    });
}

/**
 * Switches to the specified tab
 * @param {string} tabId - The ID of the tab to switch to
 */
function switchTab(tabId) {
    const popup = $('#scenario-create-dialog');
    popup.find('.tab-button').removeClass('active');
    popup.find('.tab-content').removeClass('active');
    popup.find(`.tab-button[data-tab="${tabId}"]`).addClass('active');
    popup.find(`.tab-content[data-tab="${tabId}"]`).addClass('active');
}
