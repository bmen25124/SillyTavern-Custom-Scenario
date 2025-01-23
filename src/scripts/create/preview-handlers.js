import { executeScript, interpolateText } from '../utils.js';

/**
 * Sets up preview functionality for description, first message, scenario, personality, character note
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
export function setupPreviewFunctionality(popup) {
    // Description preview
    const refreshPreviewBtn = popup.find('#refresh-preview');
    refreshPreviewBtn.on('click', () => updatePreview(popup, 'description'));

    // First message preview
    const refreshFirstMessagePreviewBtn = popup.find('#refresh-first-message-preview');
    refreshFirstMessagePreviewBtn.on('click', () => updatePreview(popup, 'first-message'));

    // Scenario preview
    const refreshScenarioPreviewBtn = popup.find('#refresh-scenario-preview');
    refreshScenarioPreviewBtn.on('click', () => updatePreview(popup, 'scenario'));

    // Personality preview
    const refreshPersonalityPreviewBtn = popup.find('#refresh-personality-preview');
    refreshPersonalityPreviewBtn.on('click', () => updatePreview(popup, 'personality'));

    // Character Note preview
    const refreshCharacterNotePreviewBtn = popup.find('#refresh-character-note-preview');
    refreshCharacterNotePreviewBtn.on('click', () => updatePreview(popup, 'character-note'));
}

/**
 * Updates the preview for other than question
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 * @param {'description'|'first-message'|'scenario'|'personality'|'character-note'} type - The type of preview to update
 * @param {boolean} [rethrowError=false] - Whether to rethrow errors
 */
export function updatePreview(popup, type, rethrowError = false) {
    const config = {
        'description': {
            contentId: '#scenario-creator-character-description',
            scriptId: '#scenario-creator-script',
            previewId: '#description-preview',
            scriptInputsId: '#script-inputs-container'
        },
        'first-message': {
            contentId: '#scenario-creator-character-first-message',
            scriptId: '#scenario-creator-first-message-script',
            previewId: '#first-message-preview',
            scriptInputsId: '#first-message-script-inputs-container'
        },
        'scenario': {
            contentId: '#scenario-creator-character-scenario',
            scriptId: '#scenario-creator-scenario-script',
            previewId: '#scenario-preview',
            scriptInputsId: '#scenario-script-inputs-container'
        },
        'personality': {
            contentId: '#scenario-creator-character-personality',
            scriptId: '#scenario-creator-personality-script',
            previewId: '#personality-preview',
            scriptInputsId: '#personality-script-inputs-container'
        },
        'character-note': {
            contentId: '#scenario-creator-character-note',
            scriptId: '#scenario-creator-character-note-script',
            previewId: '#character-note-preview',
            scriptInputsId: '#character-note-script-inputs-container'
        }
    };

    const { contentId, scriptId, previewId, scriptInputsId } = config[type];
    const textarea = popup.find(contentId);
    const scriptTextarea = popup.find(scriptId);
    const previewDiv = popup.find(previewId);
    const scriptInputsContainer = popup.find(scriptInputsId);

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
        if (rethrowError) {
            throw error;
        }
    }
}

/**
 * Updates the preview for a question
 * @param {JQuery} questionGroup - The question group jQuery element
 */
export function updateQuestionPreview(questionGroup, rethrowError = false) {
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
        if (rethrowError) {
            throw error;
        }
    }
}
