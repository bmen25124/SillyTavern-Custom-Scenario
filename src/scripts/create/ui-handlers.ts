import {
  renderExtensionTemplateAsync,
  extensionTemplateFolder,
  callGenericPopup,
  POPUP_TYPE,
  stEcho,
  extensionVersion,
  st_createPopper,
} from '../config';
import { setupPreviewFunctionality, updatePreview, updateQuestionPreview } from './preview-handlers';
import { setupTabFunctionality, setupAccordion, switchTab } from './tab-handlers';
import { setupDynamicInputs, setupRemoveButton } from './question-handlers';
import {
  loadScenarioCreateData,
  saveScenarioCreateData,
  getScenarioCreateDataFromUI,
  createProductionScenarioData,
  downloadFile,
  convertImportedData,
  removeScenarioCreateData,
} from './data-handlers';
import { applyScenarioCreateDataToUI, applyScenarioExportDataToSidebar } from './ui-state';
import { createEmptyScenarioCreateData, FullExportData, upgradeOrDowngradeData } from '../types';
import { readScenarioFromPng } from '../utils/png-handlers';

/**
 * Prepares and adds the character sidebar icon with click handler
 */
export async function prepareCharacterSidebar() {
  const characterSidebarIconHtml = $(
    await renderExtensionTemplateAsync(extensionTemplateFolder, 'character-sidebar-icon'),
  );
  $('.form_create_bottom_buttons_block').prepend(characterSidebarIconHtml);
  const characterSidebarIcon = $('#character-sidebar-icon');

  characterSidebarIcon.on('click', handleCharacterSidebarClick);
}

/**
 * Handles click on the character sidebar icon
 * Creates the scenario creator dialog and loads saved data
 */
async function handleCharacterSidebarClick() {
  // @ts-ignore
  let formElement: HTMLFormElement = $('#form_create');
  if (formElement.length === 0) {
    return;
  }
  formElement = formElement.get(0);

  const formData = new FormData(formElement);
  const scenarioCreateDialogHtml = $(
    await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-create-dialog'),
  );
  callGenericPopup(scenarioCreateDialogHtml, POPUP_TYPE.DISPLAY, '', {
    large: true,
    wide: true,
  });

  setupPopupHandlers();

  // Load saved data after popup is created
  const popup = $('#scenario-create-dialog');
  let savedData = loadScenarioCreateData();

  // Check version changes
  if (savedData.version && savedData.version !== extensionVersion) {
    await stEcho('info', `Version of cache data changed from ${savedData.version} to ${extensionVersion}`);
  }

  try {
    savedData = upgradeOrDowngradeData(savedData, 'create');
    saveScenarioCreateData(savedData);
  } catch (error) {
    await stEcho('error', 'Cache data is not compatible. Removing cache data.');
    removeScenarioCreateData();
  }
  if (!savedData.description) {
    // @ts-ignore
    savedData.description = formData.get('description');
  }
  if (!savedData.firstMessage) {
    // @ts-ignore
    savedData.firstMessage = formData.get('first_mes');
  }
  if (!savedData.scenario) {
    // @ts-ignore
    savedData.scenario = formData.get('scenario');
  }
  if (!savedData.personality) {
    // @ts-ignore
    savedData.personality = formData.get('personality');
  }
  if (!savedData.characterNote) {
    // @ts-ignore
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
  setupQuestionReordering(popup);
  setupExportButton(popup);
  setupImportButton(popup);
  setupResetButton(popup);
}
/**
 * Sets up question reordering functionality
 */
function setupQuestionReordering(popup: JQuery<HTMLElement>) {
  popup.on('click', '#move-question-up-btn, #move-question-down-btn', function (e) {
    e.preventDefault();
    const isUp = $(this).attr('id') === 'move-question-up-btn';

    // Find active question tab
    const activeTab = popup.find('#dynamic-tab-buttons .tab-button.active');
    if (!activeTab.length) return;

    const container = activeTab.closest('.tab-button-container');
    const sibling = isUp ? container.prev('.tab-button-container') : container.next('.tab-button-container');

    if (sibling.length === 0) return; // Can't move further

    // Get page number and current data
    const pageNumber = parseInt(container.attr('data-page') as string) || 1;
    const data = getScenarioCreateDataFromUI(popup);

    // Update DOM order
    const dynamicInputsContainer = popup.find('#dynamic-inputs-container');
    const dynamicTabButtons = popup.find('#dynamic-tab-buttons');

    if (isUp) {
      container.insertBefore(sibling);
    } else {
      container.insertAfter(sibling);
    }

    // Move the corresponding input group
    const tabId = activeTab.data('tab');
    const inputGroup = dynamicInputsContainer.find(`[data-tab="${tabId}"]`);
    const siblingTabId = sibling.find('.tab-button').data('tab');
    const siblingInputGroup = dynamicInputsContainer.find(`[data-tab="${siblingTabId}"]`);

    if (isUp) {
      inputGroup.insertBefore(siblingInputGroup);
    } else {
      inputGroup.insertAfter(siblingInputGroup);
    }

    // Update data layout
    const newOrder = dynamicTabButtons
      .children()
      .map(function () {
        return $(this).find('.tab-button').data('tab');
      })
      .get();

    const newLayout = newOrder.map((tabId) => {
      const inputGroup = dynamicInputsContainer.find(`[data-tab="${tabId}"]`);
      const value = inputGroup.find('.input-id').val();
      return value?.toString() || '';
    });

    data.layout[pageNumber - 1] = newLayout;
    saveScenarioCreateData(data);
  });
}

/**
 * Sets up the reset button functionality
 */
function setupResetButton(popup: JQuery<HTMLElement>) {
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
 */
function setupImportButton(popup: JQuery<HTMLElement>) {
  // Create hidden file input
  const fileInput = $('<input type="file" accept=".json, .png" style="display: none">');
  popup.append(fileInput);

  // Handle import button click
  popup.find('#import-scenario-btn').on('click', function () {
    fileInput.trigger('click');
  });

  // Handle file selection
  fileInput.on('change', async function (e: JQuery.ChangeEvent) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'image/png') {
      try {
        const buffer = await file.arrayBuffer();
        const importedData = readScenarioFromPng(buffer);

        const scenarioData = await convertImportedData(file);
        if (!scenarioData) {
          return;
        }

        // Clear existing data
        popup.find('#dynamic-tab-buttons').empty();
        popup.find('#dynamic-inputs-container').empty();

        // Apply imported data
        applyScenarioCreateDataToUI(popup, scenarioData);

        // Apply imported data to character sidebar (only neccessary fields)
        applyScenarioExportDataToSidebar(importedData);

        // Save imported data
        saveScenarioCreateData(scenarioData);
      } catch (error) {
        console.error('Import error:', error);
        await stEcho('error', 'Failed to import scenario data from PNG. Please check the file and try again.');
      }
    } else {
      // Handle JSON files
      const reader = new FileReader();
      reader.onload = async function (event) {
        if (!event.target?.result) {
          return;
        }
        try {
          const importedData = JSON.parse(event.target.result as string) as FullExportData;
          const scenarioData = await convertImportedData(importedData);
          if (!scenarioData) {
            return;
          }

          // Clear existing data
          popup.find('#dynamic-tab-buttons').empty();
          popup.find('#dynamic-inputs-container').empty();

          // Apply imported data
          applyScenarioCreateDataToUI(popup, scenarioData);

          // Apply imported data to character sidebar (only neccessary fields)
          applyScenarioExportDataToSidebar(importedData);

          // Save imported data
          saveScenarioCreateData(scenarioData);
        } catch (error) {
          console.error('Import error:', error);
          await stEcho('error', 'Failed to import scenario data. Please check the file and try again.');
        }
      };
      reader.readAsText(file);
    }

    // Reset file input for future imports
    fileInput.val('');
  });
}

/**
 * Sets up the export button functionality
 */
function setupExportButton(popup: JQuery<HTMLElement>) {
  let isExportPopupOpen = false;
  const exportButton = popup.find('#export-scenario-btn').get(0) as HTMLElement;
  const formatPopup = popup.find('#export-format-popup').get(0) as HTMLElement;

  // Create popper instance
  let exportPopper = st_createPopper(exportButton, formatPopup, {
    placement: 'left-end',
  });

  popup.find('#export-scenario-btn').on('click', function () {
    isExportPopupOpen = !isExportPopupOpen;
    popup.find('#export-format-popup').toggle(isExportPopupOpen);
    exportPopper.update();
  });

  popup.find('.export-format').on('click', async function () {
    const format = $(this).data('format') as 'json' | 'png';
    if (!format) {
      return;
    }

    // Hide popup
    popup.find('#export-format-popup').hide();
    isExportPopupOpen = false;

    const currentData = getScenarioCreateDataFromUI(popup);
    const formElement = $('#form_create').get(0) as HTMLFormElement;
    const formData = new FormData(formElement);

    // Validate all scripts before export
    let errors = [];

    // Check description
    try {
      updatePreview(popup, 'description', true);
    } catch (error: any) {
      errors.push('Description script error: ' + error.message);
    }

    // Check first message
    try {
      updatePreview(popup, 'first-message', true);
    } catch (error: any) {
      errors.push('First message script error: ' + error.message);
    }

    // Check scenario
    try {
      updatePreview(popup, 'scenario', true);
    } catch (error: any) {
      errors.push('Scenario script error: ' + error.message);
    }

    // Check personality
    try {
      updatePreview(popup, 'personality', true);
    } catch (error: any) {
      errors.push('Personality script error: ' + error.message);
    }

    // Check character note
    try {
      updatePreview(popup, 'character-note', true);
    } catch (error: any) {
      errors.push('Character note script error: ' + error.message);
    }

    // Check all question scripts
    const questionGroups = popup.find('.dynamic-input-group');
    questionGroups.each(function () {
      const group = $(this);
      const inputId = group.find('.input-id').val();
      try {
        updateQuestionPreview(group, true);
      } catch (error: any) {
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
    const productionData = await createProductionScenarioData(currentData, formData);
    downloadFile(productionData, `scenario.${format}`, format);
  });

  // Close popup when clicking outside
  $(document).on('click', function (event) {
    if (isExportPopupOpen && !$(event.target).closest('.export-container').length) {
      popup.find('#export-format-popup').hide();
      isExportPopupOpen = false;
      exportPopper.update();
    }
  });
}
