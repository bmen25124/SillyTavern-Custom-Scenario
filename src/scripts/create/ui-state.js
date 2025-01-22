import { addQuestionToUI } from './question-handlers.js';
import { updatePreview } from './preview-handlers.js';
import { switchTab } from './tab-handlers.js';

/**
 * Applies scenario data to the UI
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 * @param {import('../types.js').ScenarioData} data - The scenario data to apply
 */
export function applyScenarioDataToUI(popup, data) {
    popup.find('#scenario-creator-character-description').val(data.description);
    popup.find('#scenario-creator-script').val(data.descriptionScript);
    popup.find('#scenario-creator-character-first-message').val(data.firstMessage);
    popup.find('#scenario-creator-first-message-script').val(data.firstMessageScript);

    // Restore questions
    data.questions.forEach(question => {
        addQuestionToUI(popup, question);
        const questionGroup = popup.find(`.dynamic-input-group[data-tab="question-${question.id}"]`);
        const pageNumber = data.layout
            .findIndex(page => page.includes(question.inputId)) + 1 || 1;
        questionGroup.find('.input-page').val(pageNumber);
    });

    // Switch to active tab
    switchTab(data.activeTab);

    // Update previews
    updatePreview(popup, 'description');
    updatePreview(popup, 'first-message');
}
