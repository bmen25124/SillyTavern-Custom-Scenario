import { saveScenarioCreateData, getScenarioCreateDataFromUI } from './data-handlers';
import { updateScriptInputs } from './script-handlers';
import { updateQuestionScriptInputs } from './script-handlers';

/**
 * Sets up tab switching functionality with auto-save
 */
export function setupTabFunctionality(popup: JQuery<HTMLElement>) {
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
 */
export function setupAccordion(popup: JQuery<HTMLElement>) {
  const accordionToggles = popup.find('.accordion-toggle');

  accordionToggles.on('click', function () {
    $(this).closest('.accordion').toggleClass('open');
  });
}

/**
 * Switches to the specified tab
 */
export function switchTab(tabId: string) {
  const popup = $('#scenario-create-dialog');
  popup.find('.tab-button').removeClass('active');
  popup.find('.tab-content').removeClass('active');
  popup.find(`.tab-button[data-tab="${tabId}"]`).addClass('active');
  popup.find(`.tab-content[data-tab="${tabId}"]`).addClass('active');

  // Update script inputs based on active tab
  if (
    tabId === 'description' ||
    tabId === 'first-message' ||
    tabId === 'scenario' ||
    tabId === 'personality' ||
    tabId === 'character-note'
  ) {
    updateScriptInputs(popup, tabId);
  } else {
    updateQuestionScriptInputs(popup.find(`.dynamic-input-group[data-tab="${tabId}"]`));
  }
}
