/**
 * @typedef {Object} ScriptInput
 * @property {string} id - Input identifier
 * @property {string} type - Input type (text, checkbox, select)
 * @property {string|boolean} defaultValue - Default value for the input
 * @property {Array<{value: string, label: string}>} [options] - Options for select type
 */

/**
 * @typedef {Object} Question
 * @property {string} id - Unique identifier for the question
 * @property {string} inputId - Input identifier used in scripts
 * @property {string} type - Question type (text, checkbox, select)
 * @property {string|boolean} defaultValue - Default value
 * @property {Array<{value: string, label: string}>} [options] - Options for select type
 */

/**
 * @typedef {Object} ScenarioData
 * @property {string} description - Character description
 * @property {string} descriptionScript - Script for description
 * @property {string} firstMessage - First message
 * @property {string} firstMessageScript - Script for first message
 * @property {Array<Question>} questions - Array of questions
 * @property {string} activeTab - Currently active tab
 */

export const STORAGE_KEY = 'scenario_creator_data';

/**
 * @returns {ScenarioData}
 */
export function createEmptyScenarioData() {
    return {
        description: '',
        descriptionScript: '',
        firstMessage: '',
        firstMessageScript: '',
        questions: [],
        activeTab: 'description'
    };
}
