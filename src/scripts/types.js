import { extensionVersion } from './config.js';

/**
 * @typedef {Object} ScriptInput
 * @property {string} id - Input identifier
 * @property {string} type - Input type (text, checkbox, select)
 * @property {string|boolean} defaultValue - Default value for the input
 * @property {boolean} required - Whether this input is required
 * @property {Array<{value: string, label: string}>} [options] - Options for select type
 */

/**
 * @typedef {Object} Question
 * @property {string} id - Unique identifier for the question
 * @property {string} inputId - Input identifier used in scripts
 * @property {string} text - Question text to display
 * @property {string} script - Question script
 * @property {string} type - Question type (text, checkbox, select)
 * @property {string|boolean} defaultValue - Default value
 * @property {boolean} required - Whether this question is required
 * @property {Array<{value: string, label: string}>} [options] - Options for select type
 */

/**
 * @typedef {Object} ScenarioData
 * @property {string} description - Character description
 * @property {string} descriptionScript - Script for description
 * @property {string} firstMessage - First message
 * @property {string} firstMessageScript - Script for first message
 * @property {Array<Question>} questions - Array of questions
 * @property {Array<Array<string>>} layout - Array of arrays containing input IDs for page grouping
 * @property {string} activeTab - Currently active tab
 * @property {Object} formData - Form data
 * @property {string} version - Version of the scenario data
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
        layout: [],
        activeTab: 'description',
        version: extensionVersion
    };
}

/**
 * Validates and creates a deep copy of the input data object, ensuring version compatibility.
 * @param {Object} data - The input data object to be processed
 * @throws {Error} Throws an error if version is missing or doesn't match extensionVersion
 * @returns {Object} A deep copy of the validated data object
 */
export function upgradeOrDowngradeData(data) {
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData.version) {
        throw new Error('No version found in data');
    }

    if (newData.version !== extensionVersion) {
        throw new Error(`Data version is not ${extensionVersion}`);
    }

    return newData;
}
