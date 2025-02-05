import { addQuestionToUI } from './question-handlers';
import { updatePreview, updateQuestionPreview } from './preview-handlers';
import { createPageButton, switchTab, togglePage } from './tab-handlers';
import { updateQuestionScriptInputs, updateScriptInputs } from './script-handlers';
import { FullExportData, ScenarioCreateData } from '../types';

/**
 * Applies scenario data to the UI
 */
export function applyScenarioCreateDataToUI(popup: JQuery<HTMLElement>, data: ScenarioCreateData) {
  popup.find('#scenario-creator-character-description').val(data.description);
  popup.find('#scenario-creator-script').val(data.descriptionScript);
  popup.find('#scenario-creator-character-first-message').val(data.firstMessage);
  popup.find('#scenario-creator-first-message-script').val(data.firstMessageScript);
  popup.find('#scenario-creator-character-scenario').val(data.scenario);
  popup.find('#scenario-creator-scenario-script').val(data.scenarioScript);
  popup.find('#scenario-creator-character-personality').val(data.personality);
  popup.find('#scenario-creator-personality-script').val(data.personalityScript);
  popup.find('#scenario-creator-character-note').val(data.characterNote);
  popup.find('#scenario-creator-character-note-script').val(data.characterNoteScript);

  // Clear existing page buttons
  popup.find('#page-tab-buttons').empty();
  popup.find('#dynamic-tab-buttons').empty();

  // Find unique pages from layout
  const pages = new Set<number>();
  data.layout.forEach((_, index) => pages.add(index + 1));
  if (data.questions.length > 0 && pages.size === 0) pages.add(1);

  // Create page buttons
  pages.forEach((pageNum) => {
    const pageButton = createPageButton(pageNum);
    popup.find('#page-tab-buttons').append(pageButton);
  });

  // Sort questions based on layout array
  const sortedQuestions = [...data.questions].sort((a, b) => {
    const aPage = data.layout.findIndex((page) => page.includes(a.inputId)) + 1 || 1;
    const bPage = data.layout.findIndex((page) => page.includes(b.inputId)) + 1 || 1;
    if (aPage !== bPage) return aPage - bPage;

    // Sort by position within the page array
    const pageAIndex = data.layout[aPage - 1]?.indexOf(a.inputId) ?? -1;
    const pageBIndex = data.layout[bPage - 1]?.indexOf(b.inputId) ?? -1;
    return pageAIndex - pageBIndex;
  });

  // Restore questions in sorted order
  sortedQuestions.forEach((question) => {
    addQuestionToUI(popup, question);
    const pageNumber = data.layout.findIndex((page) => page.includes(question.inputId)) + 1 || 1;

    // Update tab button container with page attribute
    const tabButton = popup.find(`.tab-button-container:has([data-tab="question-${question.id}"])`);
    tabButton.attr('data-page', pageNumber);
  });

  // Show questions container if there are questions
  if (sortedQuestions.length > 0) {
    popup.find('#questions-container').addClass('active');
    // Show first page by default
    if (pages.size > 0) {
      togglePage(Math.min(...Array.from(pages)));
    }
  }

  // Create/update
  updateScriptInputs(popup, 'description');
  updateScriptInputs(popup, 'first-message');
  updateScriptInputs(popup, 'scenario');
  updateScriptInputs(popup, 'personality');
  updateScriptInputs(popup, 'character-note');

  // Update previews
  updatePreview(popup, 'description');
  updatePreview(popup, 'first-message');
  updatePreview(popup, 'scenario');
  updatePreview(popup, 'personality');
  updatePreview(popup, 'character-note');

  // Update script inputs for all existing questions
  popup.find('.dynamic-input-group').each(function () {
    updateQuestionScriptInputs($(this));
    updateQuestionPreview($(this));
  });

  // Switch to active tab
  switchTab(data.activeTab);
}

/**
 * Only applies necessary fields in the advanced dialog.
 */
export function applyScenarioExportDataToSidebar(importedData: FullExportData) {
  if ($('#form_create').attr('actiontype') !== 'createcharacter') {
    return;
  }

  if (importedData.data.extensions?.depth_prompt !== undefined) {
    $('#depth_prompt_depth').val(importedData.data.extensions.depth_prompt.depth);
    $('#depth_prompt_role').val(importedData.data.extensions.depth_prompt.role || 'system');
  } else {
    $('#depth_prompt_depth').val(4);
    $('#depth_prompt_role').val('system');
  }
  $('#creator_textarea').val(importedData.data.creator || '');
  $('#creator_notes_textarea').val(importedData.creatorcomment || importedData.data.creator_notes || '');
  $('#tags_textarea').val((importedData.tags || importedData.data.tags || []).join(', '));
  $('#character_version_textarea').val(importedData.data.character_version || '');
  $('#character_world').val(importedData.data.extensions?.world || '');
}
