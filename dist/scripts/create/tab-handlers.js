import { saveScenarioCreateData, getScenarioCreateDataFromUI } from './data-handlers.js';
import { updateScriptInputs } from './script-handlers.js';
import { updateQuestionScriptInputs } from './script-handlers.js';

/**
 * Sets up tab switching functionality with auto-save
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
export function setupTabFunctionality(popup) {
    popup.on('click', '.tab-button', function () {
        const tabId = $(this).data('tab');
        // Save current state before switching tabs
        const currentData = getScenarioCreateDataFromUI(popup);
        saveScenarioCreateData(currentData);

        switchTab(tabId);
    });

    // Initial state
    switchTab('description');
}

/**
 * Sets up accordion functionality
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
export function setupAccordion(popup) {
    const accordionToggles = popup.find('.accordion-toggle');

    accordionToggles.on('click', function () {
        $(this).closest('.accordion').toggleClass('open');
    });
}

/**
 * Switches to the specified tab
 * @param {string} tabId - The ID of the tab to switch to
 */
export function switchTab(tabId) {
    const popup = $('#scenario-create-dialog');
    popup.find('.tab-button').removeClass('active');
    popup.find('.tab-content').removeClass('active');
    popup.find(`.tab-button[data-tab="${tabId}"]`).addClass('active');
    popup.find(`.tab-content[data-tab="${tabId}"]`).addClass('active');

    // Update script inputs based on active tab
    if (tabId === 'description' || tabId === 'first-message' || tabId === 'scenario' || tabId === 'personality' || tabId === 'character-note') {
        updateScriptInputs(popup, tabId);
    } else {
        updateQuestionScriptInputs(popup.find(`.dynamic-input-group[data-tab="${tabId}"]`));
    }
}
