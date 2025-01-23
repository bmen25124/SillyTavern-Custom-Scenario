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
 * It is for stroring create dialog.
 * @typedef {Object} ScenarioCreateData
 * @property {string} description - Character description
 * @property {string} descriptionScript - Script for description
 * @property {string} firstMessage - First message
 * @property {string} firstMessageScript - Script for first message
 * @property {string} scenario - Scenario text
 * @property {string} scenarioScript - Script for scenario
 * @property {string} personality - Personality text
 * @property {string} personalityScript - Script for personality
 * @property {string} characterNote - Character note text
 * @property {string} characterNoteScript - Script for character note
 * @property {Array<Question>} questions - Array of questions
 * @property {Array<Array<string>>} layout - Array of arrays containing input IDs for page grouping
 * @property {string} activeTab - Currently active tab
 * @property {string} version - Version of the scenario data
 */

/**
 * @typedef {Object} ScenarioExportData
 * @property {string} descriptionScript - Script for description
 * @property {string} firstMessageScript - Script for first message
 * @property {string} scenarioScript - Script for scenario
 * @property {string} personalityScript - Script for personality
 * @property {string} characterNoteScript - Script for character note
 * @property {Array<Question>} questions - Array of questions
 * @property {Array<Array<string>>} layout - Array of arrays containing input IDs for page grouping
 * @property {string} version - Version of the scenario data
 */

/**
 * This is actually a SillyTavern json file but we just have scenario_creator as addition.
 * @typedef {Object} FullExportData
 * @property {string} description - Description of the character
 * @property {string} first_mes - First message of the character
 * @property {string} scenario - Scenario of the character
 * @property {string} personality - Personality of the character
 * @property {{name: string, description: string, first_mes: string, scenario: string, personality: string}} data - Data of the character
 * @property {ScenarioExportData} scenario_creator - Scenario creator data
 */

export const STORAGE_KEY = 'scenario_creator_data';

/**
 * @returns {ScenarioCreateData}
 */
export function createEmptyScenarioCreateData() {
    return {
        description: '',
        descriptionScript: '',
        firstMessage: '',
        firstMessageScript: '',
        scenario: '',
        scenarioScript: '',
        personality: '',
        personalityScript: '',
        characterNote: '',
        characterNoteScript: '',
        questions: [],
        layout: [],
        activeTab: 'description',
        version: extensionVersion
    };
}

/**
 * @typedef {Object} VersionUpgrade
 * @property {string[]} from - Array of compatible source versions
 * @property {string[]} to - Array of compatible target versions
 * @property {(data: ScenarioCreateData) => void} createCallback - Function to perform the upgrade with create data
 * @property {(data: ScenarioExportData) => void} exportCallback - Function to perform the upgrade with export data
 */

/**
 * @type {VersionUpgrade[]}
 */
const versionUpgrades = [
    {
        from: ['0.2.0'],
        to: '0.2.1',
        createCallback: (data) => {
            // Add personality fields if they don't exist
            if (!data.hasOwnProperty('personality')) {
                data.personality = '';
            }
            if (!data.hasOwnProperty('personalityScript')) {
                data.personalityScript = '';
            }

            // Add scenario fields if they don't exist
            if (!data.hasOwnProperty('scenario')) {
                data.scenario = '';
            }
            if (!data.hasOwnProperty('scenarioScript')) {
                data.scenarioScript = '';
            }

            // Add character note fields if they don't exist
            if (!data.hasOwnProperty('characterNote')) {
                data.characterNote = '';
            }
            if (!data.hasOwnProperty('characterNoteScript')) {
                data.characterNoteScript = '';
            }

            data.version = '0.2.1';
        },
        exportCallback: (data) => {
            // Add scenario fields if they don't exist
            if (!data.hasOwnProperty('scenarioScript')) {
                data.scenarioScript = '';
            }

            // Add personality fields if they don't exist
            if (!data.hasOwnProperty('personalityScript')) {
                data.personalityScript = '';
            }

            // Add character note fields if they don't exist
            if (!data.hasOwnProperty('characterNoteScript')) {
                data.characterNoteScript = '';
            }

            data.version = '0.2.1';
        }
    }
];

/**
 * Validates and creates a deep copy of the input data object, ensuring version compatibility.
 * @param {ScenarioCreateData | ScenarioExportData} data - The input data object to be processed
 * @param {'create'|'export'} type
 * @throws {Error} Throws an error if version is missing
 * @returns {ScenarioCreateData | ScenarioExportData} A deep copy of the validated data object
 */
export function upgradeOrDowngradeData(data, type) {
    const newData = JSON.parse(JSON.stringify(data));
    if (!newData.version) {
        throw new Error('No version found in data');
    }

    // Find and apply all applicable upgrades
    let upgraded = false;
    do {
        upgraded = false;
        for (const upgrade of versionUpgrades) {
            if (upgrade.from.includes(newData.version)) {
                if (type === 'create') {
                    upgrade.createCallback(newData);
                } else {
                    upgrade.exportCallback(newData);
                }
                upgraded = true;
                break; // Only apply one upgrade at a time
            }
        }
    } while (upgraded); // Keep upgrading until no more upgrades are applicable

    // If version is still not current after upgrades, it must be newer
    if (newData.version !== extensionVersion) {
        throw new Error(`Data version ${newData.version} is not compatible with extension version ${extensionVersion}`);
    }

    return newData;
}
