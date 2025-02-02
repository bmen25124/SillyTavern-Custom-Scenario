import { addQuestionToUI } from './question-handlers';
import { updatePreview, updateQuestionPreview } from './preview-handlers';
import { switchTab } from './tab-handlers';
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

  // Restore questions
  data.questions.forEach((question) => {
    addQuestionToUI(popup, question);
    const questionGroup = popup.find(`.dynamic-input-group[data-tab="question-${question.id}"]`);
    const pageNumber = data.layout.findIndex((page) => page.includes(question.inputId)) + 1 || 1;
    questionGroup.find('.input-page').val(pageNumber);
  });

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
