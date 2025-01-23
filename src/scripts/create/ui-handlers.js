import { renderExtensionTemplateAsync, extensionTemplateFolder, callGenericPopup, POPUP_TYPE, stEcho, extensionVersion } from '../config.js';
import { setupPreviewFunctionality, updatePreview, updateQuestionPreview } from './preview-handlers.js';
import { setupTabFunctionality, setupAccordion, switchTab } from './tab-handlers.js';
import { setupDynamicInputs } from './question-handlers.js';
import { loadScenarioCreateData, saveScenarioCreateData, getScenarioCreateDataFromUI, createProductionScenarioData, downloadFile, convertImportedData, removeScenarioCreateData } from './data-handlers.js';
import { applyScenarioCreateDataToUI } from './ui-state.js';
import { createEmptyScenarioCreateData, upgradeOrDowngradeData } from '../types.js';

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
    const scenarioCreateDialogHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-create-dialog'));
    callGenericPopup(scenarioCreateDialogHtml, POPUP_TYPE.DISPLAY, '', { large: true, wide: true });

    setupPopupHandlers();

    // Load saved data after popup is created
    const popup = $('#scenario-create-dialog');
    let savedData = loadScenarioCreateData();

    // Check version changes
    if (savedData.version && savedData.version !== extensionVersion) {
        await stEcho('info', `Version of cache data changed from ${savedData.version} to ${extensionVersion}`);
    }

    try {
        savedData = upgradeOrDowngradeData(savedData, "create");
        saveScenarioCreateData(savedData);
    } catch (error) {
        await stEcho('error', 'Cache data is not compatible. Removing cache data.');
        removeScenarioCreateData();
    }
    if (!savedData.description) {
        savedData.description = formData.get('description');
    }
    if (!savedData.firstMessage) {
        savedData.firstMessage = formData.get('first_mes');
    }
    if (!savedData.scenario) {
        savedData.scenario = formData.get('scenario');
    }
    if (!savedData.personality) {
        savedData.personality = formData.get('personality');
    }
    if (!savedData.characterNote) {
        savedData.characterNote = formData.get('depth_prompt_prompt') || '';
    }

    applyScenarioCreateDataToUI(popup, savedData);
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
    setupResetButton(popup);
}

/**
 * Sets up the reset button functionality
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
function setupResetButton(popup) {
    popup.find('#reset-scenario-btn').on('click', function () {
        // Clear the fields
        popup.find('#scenario-creator-character-description').val('');
        popup.find('#scenario-creator-script').val('');
        popup.find('#scenario-creator-character-first-message').val('');
        popup.find('#scenario-creator-first-message-script').val('');
        popup.find('#scenario-creator-character-scenario').val('');
        popup.find('#scenario-creator-scenario-script').val('');
        popup.find('#scenario-creator-character-personality').val('');
        popup.find('#scenario-creator-personality-script').val('');
        popup.find('#scenario-creator-character-note').val('');
        popup.find('#scenario-creator-character-note-script').val('');

        // Clear all dynamic questions
        popup.find('#dynamic-tab-buttons').empty();
        popup.find('#dynamic-inputs-container').empty();

        // Reset script inputs
        popup.find('#script-inputs-container').empty();
        popup.find('#first-message-script-inputs-container').empty();
        popup.find('#scenario-script-inputs-container').empty();
        popup.find('#personality-script-inputs-container').empty();
        popup.find('#character-note-script-inputs-container').empty();

        // Reset previews
        popup.find('#description-preview').text('Preview will appear here...');
        popup.find('#first-message-preview').text('Preview will appear here...');
        popup.find('#scenario-preview').text('Preview will appear here...');
        popup.find('#personality-preview').text('Preview will appear here...');
        popup.find('#character-note-preview').text('Preview will appear here...');

        // Switch to description tab
        switchTab('description');

        // Save the empty state
        saveScenarioCreateData(createEmptyScenarioCreateData());
    });
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
        fileInput.trigger('click')
    });

    // Handle file selection
    fileInput.on('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function (event) {
            try {
                const importedData = JSON.parse(event.target.result);
                const scenarioData = await convertImportedData(importedData);
                if (!scenarioData) {
                    return;
                }

                // Clear existing data
                popup.find('#dynamic-tab-buttons').empty();
                popup.find('#dynamic-inputs-container').empty();

                // Apply imported data
                applyScenarioCreateDataToUI(popup, scenarioData);

                // Save imported data
                saveScenarioCreateData(scenarioData);
            } catch (error) {
                console.error('Import error:', error);
                await stEcho('error', 'Failed to import scenario data. Please check the file and try again.');
            }
        };
        reader.readAsText(file);

        // Reset file input for future imports
        fileInput.val('');
    });
}

/**
 * Sets up the export button functionality
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
function setupExportButton(popup) {
    popup.find('#export-scenario-btn').on('click', async function () {
        const currentData = getScenarioCreateDataFromUI(popup);
        const formElement = $('#form_create').get(0);
        const formData = new FormData(formElement);

        // Validate all scripts before export
        let errors = [];

        // Check description
        try {
            updatePreview(popup, 'description', true);
        } catch (error) {
            errors.push('Description script error: ' + error.message);
        }

        // Check first message
        try {
            updatePreview(popup, 'first-message', true);
        } catch (error) {
            errors.push('First message script error: ' + error.message);
        }

        // Check scenario
        try {
            updatePreview(popup, 'scenario', true);
        } catch (error) {
            errors.push('Scenario script error: ' + error.message);
        }

        // Check personality
        try {
            updatePreview(popup, 'personality', true);
        } catch (error) {
            errors.push('Personality script error: ' + error.message);
        }

        // Check character note
        try {
            updatePreview(popup, 'character-note', true);
        } catch (error) {
            errors.push('Character note script error: ' + error.message);
        }

        // Check all question scripts
        const questionGroups = popup.find('.dynamic-input-group');
        questionGroups.each(function () {
            const group = $(this);
            const inputId = group.find('.input-id').val();
            try {
                updateQuestionPreview(group, true);
            } catch (error) {
                errors.push(`Question "${inputId}" script error: ${error.message}`);
            }
        });

        // If there are any errors, show them and stop export
        if (errors.length > 0) {
            const errorMessage = 'Export validation failed:\n' + errors.join('\n');
            await stEcho('error', errorMessage);
            return;
        }

        // If all validations pass, create and download the file
        const productionData = createProductionScenarioData(currentData, formData);
        downloadFile(productionData, 'scenario.json');
    });
}
