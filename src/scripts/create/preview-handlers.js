import { executeScript, interpolateText } from '../utils.js';

/**
 * Sets up preview functionality for description and first message
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
export function setupPreviewFunctionality(popup) {
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
export function updatePreview(popup, type) {
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
                const element = $(this).find('select');
                const label = element.find('option:selected').text();
                const value = element.val();
                answers[id] = { label, value };
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
 * Updates the preview for a question
 * @param {JQuery} questionGroup - The question group jQuery element
 */
export function updateQuestionPreview(questionGroup) {
    const questionText = questionGroup.find('.input-question').val();
    const scriptText = questionGroup.find('.question-script').val();
    const previewDiv = questionGroup.find('.question-preview');
    const scriptInputsContainer = questionGroup.find('.question-script-inputs-container');

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
                const element = $(this).find('select');
                const label = element.find('option:selected').text();
                const value = element.val();
                answers[id] = { label, value };
                break;
            default:
                answers[id] = $(this).find('input[type="text"]').val();
                break;
        }
    });

    try {
        // Execute script if exists
        const variables = scriptText ? executeScript(scriptText, answers) : answers;

        // Interpolate content with variables
        const interpolated = interpolateText(questionText, variables);
        previewDiv.text(interpolated);
    } catch (error) {
        console.error('Question preview update/script execute error:', error);
        previewDiv.text(`Question preview update/script execute error: ${error.message}`);
    }
}
