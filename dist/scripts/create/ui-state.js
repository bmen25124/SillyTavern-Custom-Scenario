import { addQuestionToUI } from './question-handlers.js';
import { updatePreview } from './preview-handlers.js';
import { switchTab } from './tab-handlers.js';
import { updateScriptInputs } from './script-handlers.js';

/**
 * Applies scenario data to the UI
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 * @param {import('../types.js').ScenarioCreateData} data - The scenario data to apply
 */
export function applyScenarioCreateDataToUI(popup, data) {
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
    data.questions.forEach(question => {
        addQuestionToUI(popup, question);
        const questionGroup = popup.find(`.dynamic-input-group[data-tab="question-${question.id}"]`);
        const pageNumber = data.layout
            .findIndex(page => page.includes(question.inputId)) + 1 || 1;
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

    // Switch to active tab
    switchTab(data.activeTab);
}
