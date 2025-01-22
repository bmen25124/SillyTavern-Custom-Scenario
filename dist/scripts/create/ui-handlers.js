import { renderExtensionTemplateAsync, extensionTemplateFolder, callGenericPopup, POPUP_TYPE, stEcho } from '../config.js';
import { setupPreviewFunctionality, updatePreview, updateQuestionPreview } from './preview-handlers.js';
import { setupTabFunctionality, setupAccordion, switchTab } from './tab-handlers.js';
import { setupDynamicInputs } from './question-handlers.js';
import { loadScenarioData, saveScenarioData, getScenarioDataFromUI, createProductionScenarioData, downloadScenarioData, convertImportedData, removeScenarioData } from './data-handlers.js';
import { applyScenarioDataToUI } from './ui-state.js';
import { createEmptyScenarioData, upgradeOrDowngradeData } from '../types.js';

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
    callGenericPopup(scenarioCreateDialogHtml, POPUP_TYPE.DISPLAY, '', { large: true, wide: true });

    setupPopupHandlers();

    // Load saved data after popup is created
    const popup = $('#scenario-create-dialog');
    let savedData = loadScenarioData();
    try {
        savedData = await upgradeOrDowngradeData(savedData);
    } catch (error) {
        await stEcho('error', 'Cache data is not compatible. Removing cache data.');
        removeScenarioData();
    }
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
    setupResetButton(popup);
}

/**
 * Sets up the reset button functionality
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
function setupResetButton(popup) {
    popup.find('#reset-scenario-btn').on('click', function () {
        // Clear the description and first message fields
        popup.find('#scenario-creator-character-description').val('');
        popup.find('#scenario-creator-script').val('');
        popup.find('#scenario-creator-character-first-message').val('');
        popup.find('#scenario-creator-first-message-script').val('');

        // Clear all dynamic questions
        popup.find('#dynamic-tab-buttons').empty();
        popup.find('#dynamic-inputs-container').empty();

        // Reset script inputs
        popup.find('#script-inputs-container').empty();
        popup.find('#first-message-script-inputs-container').empty();

        // Reset previews
        popup.find('#description-preview').text('Preview will appear here...');
        popup.find('#first-message-preview').text('Preview will appear here...');

        // Switch to description tab
        switchTab('description');

        // Save the empty state
        saveScenarioData(createEmptyScenarioData());
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
        fileInput.click();
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
                applyScenarioDataToUI(popup, scenarioData);

                // Save imported data
                saveScenarioData(scenarioData);
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
        const currentData = getScenarioDataFromUI(popup);
        const formElement = $('#form_create').get(0);
        const formData = new FormData(formElement);
        const productionData = createProductionScenarioData(currentData, formData);
        // Update previews to check errors
        let errors = 'Preview update/script execute errors:';
        try {
            updatePreview(popup, 'description', true);
        } catch (error) {
            errors += 'description'
        }
        try {
            updatePreview(popup, 'first-message', true);
        } catch (error) {
            errors += 'first message'
        }
        const questionGroups = popup.find('.dynamic-input-group');
        questionGroups.each(function () {
            const group = $(this);
            const inputId = group.find('.input-id').val();
            try {
                updateQuestionPreview(group, true)
            } catch (error) {
                errors += inputId;
            }
        });
        if (errors !== 'Preview update/script execute errors:') {
            await stEcho('error', errors);
            return;
        }


        downloadScenarioData(productionData, 'scenario.json');
    });
}
