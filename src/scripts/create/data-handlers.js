import { STORAGE_KEY, createEmptyScenarioData, upgradeOrDowngradeData } from '../types.js';
import { uuidv4, humanizedDateTime, create_save, extensionVersion, stEcho } from '../config.js';

/**
 * Creates a production-ready version of scenario data without internal state
 * @param {import('../types.js').ScenarioData} data - The full scenario data
 * @param {FormData} formData - The form data from the character creation form
 * @returns {Object} Clean scenario data for production use
 */
export function createProductionScenarioData(data, formData) {
    const { descriptionScript, firstMessageScript, questions, description, firstMessage } = data;
    const formEntries = Array.from(formData.entries());
    let jsonData;

    // Extract json_data
    for (const [key, value] of formEntries) {
        if (key === 'json_data' && value) {
            jsonData = JSON.parse(value);
            break;
        }
    }

    if (!jsonData) {
        jsonData = {};
        jsonData.name = formEntries.find(([key]) => key === 'ch_name')[1] || 'Unnamed Character';
        jsonData.personality = formEntries.find(([key]) => key === 'personality')[1] || '';
        jsonData.scenario = formEntries.find(([key]) => key === 'scenario')[1] || '';
        jsonData.mes_example = formEntries.find(([key]) => key === 'mes_example')[1] || '';
        jsonData.avatar = formEntries.find(([key]) => key === 'avatar')[1] || 'none';
        jsonData.chat = formEntries.find(([key]) => key === 'chat')[1] || '';
        jsonData.talkativeness = formEntries.find(([key]) => key === 'talkativeness')[1] || '0.5';
        jsonData.fav = formEntries.find(([key]) => key === 'fav')[1] === "true" || false;
        jsonData.tags = formEntries.find(([key]) => key === 'tags')[1] || [];

        jsonData.data = {};
        jsonData.data.name = jsonData.name;
        jsonData.data.personality = jsonData.personality;
        jsonData.data.scenario = jsonData.scenario;
        jsonData.data.mes_example = jsonData.mes_example;
        jsonData.data.creator_notes = formEntries.find(([key]) => key === 'creator_notes')[1] || '';
        jsonData.data.system_prompt = jsonData.system_prompt;
        jsonData.data.post_history_instructions = jsonData.post_history_instructions;
        jsonData.data.tags = jsonData.tags;
        jsonData.data.creator = formEntries.find(([key]) => key === 'creator')[1] || '';
        jsonData.data.character_version = formEntries.find(([key]) => key === 'character_version')[1] || '';

        const extensions = JSON.parse(JSON.stringify(create_save.extensions));
        extensions.depth_prompt = {
            prompt: formEntries.find(([key]) => key === 'depth_prompt_prompt')[1] || '',
            depth: formEntries.find(([key]) => key === 'depth_prompt_depth')[1] || 4,
            role: formEntries.find(([key]) => key === 'depth_prompt_role')[1] || 'system',
        }
        extensions.talkativeness = jsonData.talkativeness;
        extensions.fav = jsonData.fav;
        jsonData.data.extensions = extensions;
    }

    // Create scenario creator specific data
    const scenarioCreator = {
        descriptionScript,
        firstMessageScript: firstMessageScript || '',
        questions: questions.map(({ id, inputId, text, script, type, defaultValue, required, options }) => ({
            id,
            inputId,
            text,
            script: script || '',
            type,
            defaultValue,
            required,
            ...(options && { options })
        })),
        layout: data.layout || [[...questions.map(q => q.inputId)]] // Default to all questions in one page if no layout specified
    };

    // Return the final production data format
    return {
        name: jsonData.name,
        description: description,
        personality: jsonData.personality || '',
        scenario: jsonData.scenario,
        first_mes: firstMessage,
        mes_example: jsonData.mes_example || '',
        creatorcomment: jsonData.creatorcomment || '',
        avatar: jsonData.avatar || 'none',
        chat: jsonData.chat,
        talkativeness: jsonData.talkativeness || '0.5',
        fav: jsonData.fav || false,
        tags: jsonData.tags || [],
        spec: jsonData.spec || 'chara_card_v3',
        spec_version: jsonData.spec_version || '3.0',
        data: {
            name: jsonData.data.name,
            description: description,
            personality: jsonData.data.personality || '',
            scenario: jsonData.data.scenario,
            first_mes: firstMessage,
            mes_example: jsonData.data.mes_example || '',
            creator_notes: jsonData.data.creator_notes || '',
            system_prompt: jsonData.data.system_prompt || '',
            post_history_instructions: jsonData.data.post_history_instructions || '',
            tags: jsonData.data.tags || [],
            creator: jsonData.data.creator || '',
            character_version: jsonData.data.character_version || '',
            alternate_greetings: jsonData.data.alternate_greetings || [],
            extensions: jsonData.data.extensions || [],
            group_only_greetings: jsonData.data.group_only_greetings || []
        },
        create_date: humanizedDateTime(),
        scenario_creator: {
            ...scenarioCreator,
            version: extensionVersion
        }
    };
}

/**
 * Triggers download of scenario data as a JSON file
 * @param {Object} data - The data to download
 * @param {string} filename - The name of the file to download
 */
export function downloadScenarioData(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Loads scenario data from local storage
 * @returns {import('../types.js').ScenarioData} The loaded scenario data or empty data if none exists
 */
export function loadScenarioData() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : createEmptyScenarioData();
}

/**
 * Removes the scenario data from the local storage by deleting the item associated with STORAGE_KEY.
 * @function removeScenarioData
 * @returns {void}
 */
export function removeScenarioData() {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Saves scenario data to local storage
 * @param {import('../types.js').ScenarioData} data - The scenario data to save
 */
export function saveScenarioData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Extracts current scenario data from the UI
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 * @returns {import('../types.js').ScenarioData} The current scenario data
 */
export function getScenarioDataFromUI(popup) {
    const data = createEmptyScenarioData();

    data.description = popup.find('#scenario-creator-character-description').val() || '';
    data.descriptionScript = popup.find('#scenario-creator-script').val() || '';
    data.firstMessage = popup.find('#scenario-creator-character-first-message').val() || '';
    data.firstMessageScript = popup.find('#scenario-creator-first-message-script').val() || '';
    data.activeTab = popup.find('.tab-button.active').data('tab') || 'description';
    data.version = extensionVersion;

    // Get questions data and build layout
    data.questions = [];
    const questionsByPage = new Map(); // page number -> input IDs

    popup.find('.dynamic-input-group').each(function () {
        const question = {
            id: $(this).data('tab').replace('question-', ''),
            inputId: $(this).find('.input-id').val(),
            text: $(this).find('.input-question').val(),
            script: $(this).find('.question-script').val() || '',
            type: $(this).find('.input-type-select').val(),
            defaultValue: '',
            required: $(this).find('.input-required').prop('checked')
        };
        const pageNumber = parseInt($(this).find('.input-page').val()) || 1;

        switch (question.type) {
            case 'checkbox':
                question.defaultValue = $(this).find('.input-default-checkbox').prop('checked');
                break;
            case 'select':
                question.defaultValue = $(this).find('.select-default').val();
                question.options = [];
                $(this).find('.option-item').each(function () {
                    question.options.push({
                        value: $(this).find('.option-value').val(),
                        label: $(this).find('.option-label').val()
                    });
                });
                break;
            default:
                question.defaultValue = $(this).find('.input-default').val();
        }

        data.questions.push(question);

        // Group questions by page number
        if (!questionsByPage.has(pageNumber)) {
            questionsByPage.set(pageNumber, []);
        }
        questionsByPage.set(pageNumber, [...questionsByPage.get(pageNumber), question.inputId]);
    });

    // Convert page map to layout array
    data.layout = Array.from(questionsByPage.keys())
        .sort((a, b) => a - b) // Sort page numbers
        .map(pageNum => questionsByPage.get(pageNum));

    return data;
}

/**
 * Converts imported data to the correct format with internal state
 * @param {Object} importedData - The imported scenario data
 * @returns {import('../types.js').ScenarioData | null} Converted scenario data or null if there is an error
 */
export async function convertImportedData(importedData) {
    // Extract scenario creator specific data
    let scenarioCreator = importedData.scenario_creator || {};
    try {
        scenarioCreator = upgradeOrDowngradeData(scenarioCreator);
    } catch (error) {
        await stEcho('error', error.message);
        return null;
    }

    const questions = (scenarioCreator.questions || []).map(q => ({
        ...q,
        id: q.id || uuidv4()
    }));

    // Handle layout information
    let layout;
    if (scenarioCreator.layout && Array.isArray(scenarioCreator.layout)) {
        layout = scenarioCreator.layout;
    } else {
        // Default to all questions in one page
        layout = [[...questions.map(q => q.inputId)]];
    }

    return {
        description: importedData.description || '',
        descriptionScript: scenarioCreator.descriptionScript || '',
        firstMessage: importedData.first_mes || '',
        firstMessageScript: scenarioCreator.firstMessageScript || '',
        questions,
        layout,
        activeTab: 'description',
        version: scenarioCreator.version
    };
}
