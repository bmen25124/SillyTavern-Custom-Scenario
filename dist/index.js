import { uuidv4 } from '../../../../utils.js';
import { getCharacters } from '../../../../../script.js';
import { humanizedDateTime } from '../../../../RossAscends-mods.js';
import { getContext } from '../../../../extensions.js';

// @ts-ignore
// import { renderExtensionTemplateAsync } from '../../../../extensions.js';
// @ts-ignore
// import { callGenericPopup, POPUP_TYPE, POPUP_RESULT } from '../../../../popup.js';
// @ts-ignore
// import { SlashCommandParser } from '../../../../slash-commands/SlashCommandParser.js';
// @ts-ignore
const extensionName = 'SillyTavern-Custom-Scenario';
const extensionVersion = '0.2.1';
const extensionTemplateFolder = `third-party/${extensionName}/templates`;
/**
 * Sends an echo message using the SlashCommandParser's echo command.
 */
async function stEcho(severity, message) {
    await getContext().SlashCommandParser.commands['echo'].callback({ severity: severity }, message);
}
/**
 * Executes the 'go' slash command to switch to a specified character.
 */
async function stGo(name) {
    await getContext().SlashCommandParser.commands['go'].callback(undefined, name);
}
function renderExtensionTemplateAsync(extensionName, templateId, templateData, sanitize, localize) {
    return getContext().renderExtensionTemplateAsync(extensionName, templateId, templateData, sanitize, localize);
}
var POPUP_TYPE;
(function (POPUP_TYPE) {
    POPUP_TYPE[POPUP_TYPE["TEXT"] = 1] = "TEXT";
    POPUP_TYPE[POPUP_TYPE["CONFIRM"] = 2] = "CONFIRM";
    POPUP_TYPE[POPUP_TYPE["INPUT"] = 3] = "INPUT";
    POPUP_TYPE[POPUP_TYPE["DISPLAY"] = 4] = "DISPLAY";
    POPUP_TYPE[POPUP_TYPE["CROP"] = 5] = "CROP";
})(POPUP_TYPE || (POPUP_TYPE = {}));
var POPUP_RESULT;
(function (POPUP_RESULT) {
    POPUP_RESULT[POPUP_RESULT["AFFIRMATIVE"] = 1] = "AFFIRMATIVE";
    POPUP_RESULT[POPUP_RESULT["NEGATIVE"] = 0] = "NEGATIVE";
    // @ts-ignore - not typed
    POPUP_RESULT[POPUP_RESULT["CANCELLED"] = null] = "CANCELLED";
})(POPUP_RESULT || (POPUP_RESULT = {}));
function callGenericPopup(content, type, inputValue, popupOptions) {
    return getContext().callGenericPopup(content, type, inputValue, popupOptions);
}
function getRequestHeaders() {
    return getContext().getRequestHeaders();
}
function st_getcreateCharacterData() {
    return getContext().createCharacterData;
}
// TODO: Get from getContext()
function st_uuidv4() {
    return uuidv4();
}
// TODO: Get from getContext()
async function st_getCharacters() {
    return await getCharacters();
}
// TODO: Get from getContext()
function st_humanizedDateTime() {
    return humanizedDateTime();
}

function executeScript(script, answers) {
    // Clone answers to avoid modifying the original object
    const variables = JSON.parse(JSON.stringify(answers));
    // Create a function that returns all variables
    const scriptFunction = new Function('answers', `
        let variables = JSON.parse('${JSON.stringify(variables)}');
        ${script}
        return variables;
    `);
    return scriptFunction(variables);
}
function interpolateText(template, variables) {
    const newVariables = JSON.parse(JSON.stringify(variables));
    for (const [key, value] of Object.entries(variables)) {
        if (value && typeof value === 'object' && value.hasOwnProperty('label')) {
            newVariables[key] = value.label;
        }
    }
    let result = template;
    const regex = /\{\{([^}]+)\}\}/g;
    let maxIterations = 10; // Prevent infinite recursion
    let iteration = 0;
    while (result.includes('{{') && iteration < maxIterations) {
        result = result.replace(regex, (match, key) => {
            const variable = newVariables[key];
            if (variable === undefined || variable === null || variable === '') {
                return match; // Keep original if variable is undefined, null, or empty
            }
            // Recursively interpolate if the variable contains template syntax
            return variable.toString().includes('{{')
                ? interpolateText(variable.toString(), newVariables)
                : variable;
        });
        iteration++;
    }
    return result;
}

/**
 * Sets up preview functionality for description, first message, scenario, personality, character note
 */
function setupPreviewFunctionality(popup) {
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
 */
function updatePreview(popup, type, rethrowError = false) {
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
    }
    catch (error) {
        console.error('Preview update/script execute error:', error);
        previewDiv.text(`Preview update/script execute error: ${error.message}`);
        if (rethrowError) {
            throw error;
        }
    }
}
/**
 * Updates the preview for a question
 */
function updateQuestionPreview(questionGroup, rethrowError = false) {
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
    }
    catch (error) {
        console.error('Question preview update/script execute error:', error);
        previewDiv.text(`Question preview update/script execute error: ${error.message}`);
        if (rethrowError) {
            throw error;
        }
    }
}

const STORAGE_KEY = 'scenario_creator_data';
function createEmptyScenarioCreateData() {
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
 * @param data - The input data object to be processed
 * @throws throws an error if version is missing
 */
function upgradeOrDowngradeData(data, type) {
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
                }
                else {
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

/**
 * Creates a production-ready version of scenario data without internal state
 */
function createProductionScenarioData(data, formData) {
    const { descriptionScript, firstMessageScript, scenarioScript, personalityScript, characterNote, characterNoteScript, questions, description, firstMessage, scenario, personality } = data;
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
        // @ts-ignore
        jsonData.name = 'Unnamed Character';
        // @ts-ignore
        jsonData.personality = formEntries.find(([key]) => key === 'personality')[1] || '';
        // @ts-ignore
        jsonData.scenario = formEntries.find(([key]) => key === 'scenario')[1] || '';
        // @ts-ignore
        jsonData.mes_example = formEntries.find(([key]) => key === 'mes_example')[1] || '';
        // @ts-ignore
        jsonData.avatar = formEntries.find(([key]) => key === 'avatar')[1] || 'none';
        // @ts-ignore
        jsonData.chat = formEntries.find(([key]) => key === 'chat')[1] || '';
        // @ts-ignore
        jsonData.talkativeness = formEntries.find(([key]) => key === 'talkativeness')[1] || '0.5';
        // @ts-ignore
        jsonData.fav = formEntries.find(([key]) => key === 'fav')[1] === "true" || false;
        // @ts-ignore
        jsonData.tags = formEntries.find(([key]) => key === 'tags')[1] || [];
        // @ts-ignore
        jsonData.data = {};
        // @ts-ignore
        jsonData.data.name = jsonData.name;
        // @ts-ignore
        jsonData.data.personality = jsonData.personality;
        // @ts-ignore
        jsonData.data.scenario = jsonData.scenario;
        // @ts-ignore
        jsonData.data.mes_example = jsonData.mes_example;
        // @ts-ignore
        jsonData.data.creator_notes = formEntries.find(([key]) => key === 'creator_notes')[1] || '';
        // @ts-ignore
        jsonData.data.system_prompt = jsonData.system_prompt;
        // @ts-ignore
        jsonData.data.post_history_instructions = jsonData.post_history_instructions;
        // @ts-ignore
        jsonData.data.tags = jsonData.tags;
        // @ts-ignore
        jsonData.data.creator = formEntries.find(([key]) => key === 'creator')[1] || '';
        // @ts-ignore
        jsonData.data.character_version = formEntries.find(([key]) => key === 'character_version')[1] || '';
        const extensions = JSON.parse(JSON.stringify(st_getcreateCharacterData().extensions));
        extensions.depth_prompt = {
            prompt: characterNote || '',
            // @ts-ignore
            depth: formEntries.find(([key]) => key === 'depth_prompt_depth')[1] || 4,
            // @ts-ignore
            role: formEntries.find(([key]) => key === 'depth_prompt_role')[1] || 'system',
        };
        // @ts-ignore
        extensions.talkativeness = jsonData.talkativeness;
        // @ts-ignore
        extensions.fav = jsonData.fav;
        // @ts-ignore
        jsonData.data.extensions = extensions;
    }
    const scenarioCreator = {
        descriptionScript: descriptionScript,
        firstMessageScript: firstMessageScript,
        scenarioScript: scenarioScript,
        personalityScript: personalityScript,
        characterNoteScript: characterNoteScript,
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
        layout: data.layout || [[...questions.map(q => q.inputId)]], // Default to all questions in one page if no layout specified
        version: extensionVersion,
    };
    // Return the final production data format
    return {
        name: jsonData.name,
        description: description,
        personality: personality,
        scenario: scenario,
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
            personality: personality,
            scenario: scenario,
            first_mes: firstMessage,
            // @ts-ignore
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
        create_date: st_humanizedDateTime(),
        scenario_creator: scenarioCreator
    };
}
/**
 * Triggers download of scenario data as a JSON file
 */
function downloadFile(data, filename) {
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
 */
function loadScenarioCreateData() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : createEmptyScenarioCreateData();
}
/**
 * Removes the scenario data from the local storage by deleting the item associated with STORAGE_KEY.
 */
function removeScenarioCreateData() {
    localStorage.removeItem(STORAGE_KEY);
}
/**
 * Saves scenario data to local storage
 */
function saveScenarioCreateData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
/**
 * Extracts current scenario data from the UI
 */
function getScenarioCreateDataFromUI(popup) {
    const data = createEmptyScenarioCreateData();
    // @ts-ignore
    data.description = popup.find('#scenario-creator-character-description').val() || '';
    // @ts-ignore
    data.descriptionScript = popup.find('#scenario-creator-script').val() || '';
    // @ts-ignore
    data.firstMessage = popup.find('#scenario-creator-character-first-message').val() || '';
    // @ts-ignore
    data.firstMessageScript = popup.find('#scenario-creator-first-message-script').val() || '';
    // @ts-ignore
    data.scenario = popup.find('#scenario-creator-character-scenario').val() || '';
    // @ts-ignore
    data.scenarioScript = popup.find('#scenario-creator-scenario-script').val() || '';
    data.activeTab = popup.find('.tab-button.active').data('tab') || 'description';
    data.version = extensionVersion;
    // @ts-ignore
    data.personality = popup.find('#scenario-creator-character-personality').val() || '';
    // @ts-ignore
    data.personalityScript = popup.find('#scenario-creator-personality-script').val() || '';
    // @ts-ignore
    data.characterNote = popup.find('#scenario-creator-character-note').val() || '';
    // @ts-ignore
    data.characterNoteScript = popup.find('#scenario-creator-character-note-script').val() || '';
    // Get questions data and build layout
    data.questions = [];
    const questionsByPage = new Map(); // page number -> input IDs
    popup.find('.dynamic-input-group').each(function () {
        const question = {
            id: $(this).data('tab').replace('question-', ''),
            // @ts-ignore
            inputId: $(this).find('.input-id').val(),
            // @ts-ignore
            text: $(this).find('.input-question').val(),
            // @ts-ignore
            script: $(this).find('.question-script').val() || '',
            // @ts-ignore
            type: $(this).find('.input-type-select').val(),
            defaultValue: '',
            required: $(this).find('.input-required').prop('checked')
        };
        // @ts-ignore
        const pageNumber = parseInt($(this).find('.input-page').val()) || 1;
        switch (question.type) {
            case 'checkbox':
                question.defaultValue = $(this).find('.input-default-checkbox').prop('checked');
                break;
            case 'select':
                // @ts-ignore
                question.defaultValue = $(this).find('.select-default').val();
                question.options = [];
                $(this).find('.option-item').each(function () {
                    // @ts-ignore
                    question.options.push({
                        // @ts-ignore
                        value: $(this).find('.option-value').val(),
                        // @ts-ignore
                        label: $(this).find('.option-label').val()
                    });
                });
                break;
            default:
                // @ts-ignore
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
 * @returns null if there is an error
 */
async function convertImportedData(importedData) {
    // Extract scenario creator specific data
    let scenarioCreator = importedData.scenario_creator || {};
    // Check version changes
    if (scenarioCreator.version && scenarioCreator.version !== extensionVersion) {
        await stEcho('info', `Imported data version changed from ${scenarioCreator.version} to ${extensionVersion}`);
    }
    try {
        scenarioCreator = upgradeOrDowngradeData(scenarioCreator, "export");
    }
    catch (error) {
        await stEcho('error', error.message);
        return null;
    }
    const questions = (scenarioCreator.questions || []).map(q => ({
        ...q,
        id: q.id || st_uuidv4()
    }));
    // Handle layout information
    let layout;
    if (scenarioCreator.layout && Array.isArray(scenarioCreator.layout)) {
        layout = scenarioCreator.layout;
    }
    else {
        // Default to all questions in one page
        layout = [[...questions.map(q => q.inputId)]];
    }
    return {
        description: importedData.description || '',
        descriptionScript: scenarioCreator.descriptionScript || '',
        firstMessage: importedData.first_mes || '',
        firstMessageScript: scenarioCreator.firstMessageScript || '',
        scenario: importedData.scenario || '',
        scenarioScript: scenarioCreator.scenarioScript || '',
        personality: importedData.personality || '',
        personalityScript: scenarioCreator.personalityScript || '',
        characterNote: importedData.data.extensions?.depth_prompt?.prompt || '',
        characterNoteScript: scenarioCreator.characterNoteScript || '',
        questions,
        layout,
        activeTab: 'description',
        version: scenarioCreator.version
    };
}

/**
 * Sets up script input update handlers for all tabs
 */
function updateScriptInputs(popup, type) {
    const config = {
        'description': {
            containerId: '#script-inputs-container'
        },
        'first-message': {
            containerId: '#first-message-script-inputs-container'
        },
        'scenario': {
            containerId: '#scenario-script-inputs-container'
        },
        'personality': {
            containerId: '#personality-script-inputs-container'
        },
        'character-note': {
            containerId: '#character-note-script-inputs-container'
        }
    };
    const container = popup.find(config[type].containerId);
    // Store existing input values before emptying container
    const existingValues = {};
    container.find('.script-input-group').each(function () {
        const id = $(this).data('id');
        const inputType = $(this).data('type');
        switch (inputType) {
            case 'checkbox':
                existingValues[id] = $(this).find('input[type="checkbox"]').prop('checked');
                break;
            case 'select':
                existingValues[id] = $(this).find('select').val();
                break;
            default:
                existingValues[id] = $(this).find('input[type="text"]').val();
                break;
        }
    });
    container.empty();
    // Create script inputs for the specified tab
    popup.find('.dynamic-input-group').each(function () {
        const id = $(this).find('.input-id').val();
        if (!id)
            return;
        const inputType = $(this).find('.input-type-select').val();
        let defaultValue;
        switch (inputType) {
            case 'checkbox':
                defaultValue = $(this).find('.input-default-checkbox').prop('checked');
                break;
            case 'select':
                defaultValue = $(this).find('.select-default').val();
                break;
            default:
                defaultValue = $(this).find('.input-default').val();
                break;
        }
        const helpText = inputType === 'select'
            ? 'Access using: variables.' + id + '.value and variables.' + id + '.label'
            : 'Access using: variables.' + id;
        const inputGroup = $(`
            <div class="script-input-group" data-id="${id}" data-type="${inputType}">
                <label for="script-input-${id}-${type}" title="${helpText}">${id}:</label>
                ${inputType === 'checkbox'
            ? `<input type="checkbox" id="script-input-${id}-${type}" class="text_pole" ${defaultValue ? 'checked' : ''} title="${helpText}">`
            : inputType === 'select'
                ? `<select id="script-input-${id}-${type}" class="text_pole" title="${helpText}">
                            ${$(this).find('.select-default').html()}
                           </select>`
                : `<input type="text" id="script-input-${id}-${type}" class="text_pole" value="${defaultValue || ''}" title="${helpText}">`}
            </div>
        `);
        container.append(inputGroup);
        // Restore previous value if it exists, otherwise use default
        if (String(id) in existingValues) {
            if (inputType === 'checkbox') {
                inputGroup.find('input[type="checkbox"]').prop('checked', existingValues[id]);
            }
            else if (inputType === 'select') {
                inputGroup.find('select').val(existingValues[id]);
            }
            else {
                inputGroup.find('input[type="text"]').val(existingValues[id]);
            }
        }
        else if (inputType === 'select') {
            // Set the default value only for new inputs
            container.find(`select#script-input-${id}-${type}`).val(defaultValue);
        }
    });
}
/**
 * Updates script inputs for a specific question
 */
function updateQuestionScriptInputs(questionGroup) {
    const container = questionGroup.find('.question-script-inputs-container');
    const popup = questionGroup.closest('#scenario-create-dialog');
    const allInputs = popup.find('.dynamic-input-group');
    // Store existing values
    const existingValues = {};
    container.find('.script-input-group').each(function () {
        const id = $(this).data('id');
        const inputType = $(this).data('type');
        switch (inputType) {
            case 'checkbox':
                existingValues[id] = $(this).find('input[type="checkbox"]').prop('checked');
                break;
            case 'select':
                existingValues[id] = $(this).find('select').val();
                break;
            default:
                existingValues[id] = $(this).find('input[type="text"]').val();
                break;
        }
    });
    container.empty();
    // Add script inputs for all questions except self
    allInputs.each(function () {
        const currentQuestionId = $(this).data('tab');
        if (currentQuestionId === questionGroup.data('tab')) {
            return; // Skip self to avoid circular reference
        }
        const id = $(this).find('.input-id').val();
        if (!id)
            return;
        const inputType = $(this).find('.input-type-select').val();
        let defaultValue;
        switch (inputType) {
            case 'checkbox':
                defaultValue = $(this).find('.input-default-checkbox').prop('checked');
                break;
            case 'select':
                defaultValue = $(this).find('.select-default').val();
                break;
            default:
                defaultValue = $(this).find('.input-default').val();
                break;
        }
        const helpText = inputType === 'select'
            ? 'Access using: variables.' + id + '.value and variables.' + id + '.label'
            : 'Access using: variables.' + id;
        const inputGroup = $(`
            <div class="script-input-group" data-id="${id}" data-type="${inputType}">
                <label for="script-input-${id}-${currentQuestionId}" title="${helpText}">${id}:</label>
                ${inputType === 'checkbox'
            ? `<input type="checkbox" id="script-input-${id}-${currentQuestionId}" class="text_pole" ${defaultValue ? 'checked' : ''} title="${helpText}">`
            : inputType === 'select'
                ? `<select id="script-input-${id}-${currentQuestionId}" class="text_pole" title="${helpText}">
                               ${$(this).find('.select-default').html()}
                           </select>`
                : `<input type="text" id="script-input-${id}-${currentQuestionId}" class="text_pole" value="${defaultValue || ''}" title="${helpText}">`}
            </div>
        `);
        container.append(inputGroup);
        // Restore previous value if it exists
        if (String(id) in existingValues) {
            if (inputType === 'checkbox') {
                inputGroup.find('input[type="checkbox"]').prop('checked', existingValues[id]);
            }
            else if (inputType === 'select') {
                inputGroup.find('select').val(existingValues[id]);
            }
            else {
                inputGroup.find('input[type="text"]').val(existingValues[id]);
            }
        }
    });
}

/**
 * Sets up tab switching functionality with auto-save
 */
function setupTabFunctionality(popup) {
    popup.on('click', '.tab-button', function () {
        const tabId = $(this).data('tab');
        // Save current state before switching tabs
        const currentData = getScenarioCreateDataFromUI(popup);
        saveScenarioCreateData(currentData);
        switchTab(tabId);
    });
    // Initial state
    switchTab('description');
}
/**
 * Sets up accordion functionality
 */
function setupAccordion(popup) {
    const accordionToggles = popup.find('.accordion-toggle');
    accordionToggles.on('click', function () {
        $(this).closest('.accordion').toggleClass('open');
    });
}
/**
 * Switches to the specified tab
 */
function switchTab(tabId) {
    const popup = $('#scenario-create-dialog');
    popup.find('.tab-button').removeClass('active');
    popup.find('.tab-content').removeClass('active');
    popup.find(`.tab-button[data-tab="${tabId}"]`).addClass('active');
    popup.find(`.tab-content[data-tab="${tabId}"]`).addClass('active');
    // Update script inputs based on active tab
    if (tabId === 'description' || tabId === 'first-message' || tabId === 'scenario' || tabId === 'personality' || tabId === 'character-note') {
        updateScriptInputs(popup, tabId);
    }
    else {
        updateQuestionScriptInputs(popup.find(`.dynamic-input-group[data-tab="${tabId}"]`));
    }
}

/**
 * Sets up handlers for select options
 */
function setupOptionHandlers(newOption, optionsList, selectDefault) {
    newOption.find('.option-value, .option-label').on('input', function () {
        updateDefaultOptions(optionsList, selectDefault);
    });
    newOption.find('.remove-option-btn').on('click', function () {
        $(this).closest('.option-item').remove();
        updateDefaultOptions(optionsList, selectDefault);
    });
}
/**
 * Updates the default options for a select input
 */
function updateDefaultOptions(optionsList, selectDefault) {
    // Store current selection
    const currentValue = selectDefault.val();
    // Clear existing options except the placeholder
    selectDefault.find('option:not(:first)').remove();
    // Add new options
    optionsList.find('.option-item').each(function () {
        const value = $(this).find('.option-value').val();
        const label = $(this).find('.option-label').val();
        if (value && label) {
            selectDefault.append(`<option value="${value}">${label}</option>`);
        }
    });
    // Restore previous selection if it still exists
    if (selectDefault.find(`option[value="${currentValue}"]`).length) {
        selectDefault.val(currentValue);
    }
}
/**
 * Sets up functionality for adding options to select inputs
 */
function setupAddOptionButton(newInput, popup) {
    newInput.find('.add-option-btn').on('click', function () {
        const optionsList = $(this).closest('.select-options-container').find('.options-list');
        const optionTemplate = popup.find('#select-option-template').html();
        const newOption = $(optionTemplate);
        const selectDefault = $(this).closest('.dynamic-input-group').find('.select-default');
        setupOptionHandlers(newOption, optionsList, selectDefault);
        optionsList.append(newOption);
    });
}

/**
 * Sets up change handler for input type selection
 */
function setupInputTypeChangeHandler(newInput) {
    newInput.find('.input-type-select').on('change', function () {
        const container = $(this).closest('.dynamic-input-group');
        const selectOptionsContainer = container.find('.select-options-container');
        const defaultValueContainer = container.find('.default-value-container');
        const textDefault = defaultValueContainer.find('.input-default');
        const checkboxDefault = defaultValueContainer.find('.checkbox-default');
        const selectDefault = defaultValueContainer.find('.select-default');
        switch ($(this).val()) {
            case 'select':
                selectOptionsContainer.show();
                defaultValueContainer.show();
                textDefault.hide();
                checkboxDefault.hide();
                selectDefault.show();
                break;
            case 'checkbox':
                selectOptionsContainer.hide();
                defaultValueContainer.show();
                textDefault.hide();
                checkboxDefault.show();
                selectDefault.hide();
                break;
            default: // text
                selectOptionsContainer.hide();
                defaultValueContainer.show();
                textDefault.show();
                checkboxDefault.hide();
                selectDefault.hide();
                break;
        }
    });
}
/**
 * Sets up functionality for removing questions
 */
function setupRemoveButton(tabContainer, popup) {
    tabContainer.find('.remove-input-btn').on('click', function () {
        const tabId = tabContainer.find('.tab-button').data('tab');
        const isCurrentTabActive = tabContainer.find('.tab-button').hasClass('active');
        const isNotQuestion = ['description', 'first-message', 'scenario', 'personality', 'character-note'].includes(tabId);
        tabContainer.remove();
        popup.find(`.tab-content[data-tab="${tabId}"]`).remove();
        // If removing active tab that's not question, switch to description
        if (isCurrentTabActive && !isNotQuestion) {
            switchTab('description');
        }
        // If not a question tab, update script inputs
        else if (isNotQuestion) {
            updateScriptInputs(popup, tabId);
        }
    });
}
/**
 * Adds a question to the UI
 */
function addQuestionToUI(popup, question) {
    const dynamicInputsContainer = popup.find('#dynamic-inputs-container');
    const dynamicTabButtons = popup.find('#dynamic-tab-buttons');
    const inputTemplate = popup.find('#dynamic-input-template');
    const tabButtonTemplate = popup.find('#tab-button-template');
    const tabHtml = tabButtonTemplate.html()
        .replace(/{id}/g, question.id)
        .replace(/{number}/g, question.inputId || 'unnamed');
    const newInput = $(inputTemplate.html().replace(/{id}/g, question.id));
    // Set values
    newInput.find('.input-id').val(question.inputId);
    newInput.find('.input-type-select').val(question.type).trigger('change');
    newInput.find('.input-question').val(question.text || '');
    newInput.find('.question-script').val(question.script || '');
    newInput.find('.input-required').prop('checked', question.required);
    // Setup question preview refresh button
    newInput.find('.refresh-question-preview').on('click', function () {
        updateQuestionPreview($(this).closest('.dynamic-input-group'));
    });
    const accordionToggles = newInput.find('.accordion-toggle');
    accordionToggles.on('click', function () {
        $(this).closest('.accordion').toggleClass('open');
    });
    switch (question.type) {
        case 'checkbox':
            newInput.find('.default-value-input-container .checkbox-default').show();
            newInput.find('.default-value-input-container textarea').hide();
            break;
        case 'select':
            const optionsList = newInput.find('.options-list');
            const selectDefault = newInput.find('.select-default');
            // Clear existing default options
            selectDefault.find('option:not(:first)').remove();
            // Add options and set up handlers
            question.options?.forEach(option => {
                const optionTemplate = popup.find('#select-option-template').html();
                const newOption = $(optionTemplate);
                newOption.find('.option-value').val(option.value);
                newOption.find('.option-label').val(option.label);
                optionsList.append(newOption);
                // Add option to select default
                if (option.value && option.label) {
                    selectDefault.append(`<option value="${option.value}">${option.label}</option>`);
                }
                // Set up handlers after the option is in DOM
                setupOptionHandlers(newOption, optionsList, selectDefault);
            });
            newInput.find('.select-options-container').show();
            newInput.find('.default-value-input-container select').show();
            newInput.find('.default-value-input-container textarea').hide();
            // Set default value after all options are added
            selectDefault.val(question.defaultValue);
            break;
        default:
            newInput.find('.input-default').val(question.defaultValue);
    }
    setupInputTypeChangeHandler(newInput);
    setupAddOptionButton(newInput, popup);
    setupScriptInputsUpdateHandlers(newInput, popup);
    dynamicTabButtons.append(tabHtml);
    dynamicInputsContainer.append(newInput);
    setupRemoveButton(dynamicTabButtons.find('.tab-button-container:last'), popup);
}
/**
 * Sets up dynamic input functionality
 */
function setupDynamicInputs(popup) {
    const addInputBtn = popup.find('#add-input-btn');
    addInputBtn.on('click', () => {
        const id = st_uuidv4();
        const question = {
            id,
            inputId: '',
            text: '',
            type: 'text',
            defaultValue: '',
            script: '',
            required: true,
        };
        addQuestionToUI(popup, question);
        // Save state and switch to new tab
        const currentData = getScenarioCreateDataFromUI(popup);
        saveScenarioCreateData(currentData);
        switchTab(`question-${id}`);
    });
}
/**
 * Sets up update handlers for script inputs
 */
function setupScriptInputsUpdateHandlers(newInput, popup) {
    // Update tab name when input ID changes
    newInput.find('.input-id').on('change', function () {
        const tabId = newInput.data('tab');
        const newInputId = $(this).val() || 'unnamed';
        const tabButtonContainer = popup.find(`.tab-button-container:has(.tab-button[data-tab="${tabId}"])`);
        const tabButton = tabButtonContainer.find('.tab-button');
        // Create new tab button HTML preserving the data-tab attribute
        tabButton.html(`Question ${newInputId}`);
        // Update script inputs when ID changes
        updateQuestionScriptInputs(newInput);
    });
    // Initial script inputs setup
    updateQuestionScriptInputs(newInput);
    // Update script inputs when any question changes
    newInput.find('.input-type-select, .input-default, .input-default-checkbox, .select-default').on('change', function () {
        updateQuestionScriptInputs(newInput);
    });
}

/**
 * Applies scenario data to the UI
 */
function applyScenarioCreateDataToUI(popup, data) {
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

/**
 * Prepares and adds the character sidebar icon with click handler
 */
async function prepareCharacterSidebar() {
    const characterSidebarIconHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'character-sidebar-icon'));
    $('.form_create_bottom_buttons_block').prepend(characterSidebarIconHtml);
    const characterSidebarIcon = $('#character-sidebar-icon');
    characterSidebarIcon.on('click', handleCharacterSidebarClick);
}
/**
 * Handles click on the character sidebar icon
 * Creates the scenario creator dialog and loads saved data
 */
async function handleCharacterSidebarClick() {
    // @ts-ignore
    let formElement = $('#form_create');
    if (formElement.length === 0) {
        return;
    }
    formElement = formElement.get(0);
    const formData = new FormData(formElement);
    const scenarioCreateDialogHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-create-dialog'));
    callGenericPopup(scenarioCreateDialogHtml, POPUP_TYPE.DISPLAY, '', { large: true, wide: true });
    setupPopupHandlers();
    // Load saved data after popup is created
    const popup = $('#scenario-create-dialog');
    let savedData = loadScenarioCreateData();
    // Check version changes
    if (savedData.version && savedData.version !== extensionVersion) {
        await stEcho('info', `Version of cache data changed from ${savedData.version} to ${extensionVersion}`);
    }
    try {
        savedData = upgradeOrDowngradeData(savedData, "create");
        saveScenarioCreateData(savedData);
    }
    catch (error) {
        await stEcho('error', 'Cache data is not compatible. Removing cache data.');
        removeScenarioCreateData();
    }
    if (!savedData.description) {
        // @ts-ignore
        savedData.description = formData.get('description');
    }
    if (!savedData.firstMessage) {
        // @ts-ignore
        savedData.firstMessage = formData.get('first_mes');
    }
    if (!savedData.scenario) {
        // @ts-ignore
        savedData.scenario = formData.get('scenario');
    }
    if (!savedData.personality) {
        // @ts-ignore
        savedData.personality = formData.get('personality');
    }
    if (!savedData.characterNote) {
        // @ts-ignore
        savedData.characterNote = formData.get('depth_prompt_prompt') || '';
    }
    applyScenarioCreateDataToUI(popup, savedData);
}
/**
 * Sets up all event handlers for the scenario creator popup
 */
function setupPopupHandlers() {
    const popup = $('#scenario-create-dialog');
    setupPreviewFunctionality(popup);
    setupTabFunctionality(popup);
    setupAccordion(popup);
    setupDynamicInputs(popup);
    setupExportButton(popup);
    setupImportButton(popup);
    setupResetButton(popup);
}
/**
 * Sets up the reset button functionality
 */
function setupResetButton(popup) {
    popup.find('#reset-scenario-btn').on('click', function () {
        // Clear the fields
        popup.find('#scenario-creator-character-description').val('');
        popup.find('#scenario-creator-script').val('');
        popup.find('#scenario-creator-character-first-message').val('');
        popup.find('#scenario-creator-first-message-script').val('');
        popup.find('#scenario-creator-character-scenario').val('');
        popup.find('#scenario-creator-scenario-script').val('');
        popup.find('#scenario-creator-character-personality').val('');
        popup.find('#scenario-creator-personality-script').val('');
        popup.find('#scenario-creator-character-note').val('');
        popup.find('#scenario-creator-character-note-script').val('');
        // Clear all dynamic questions
        popup.find('#dynamic-tab-buttons').empty();
        popup.find('#dynamic-inputs-container').empty();
        // Reset script inputs
        popup.find('#script-inputs-container').empty();
        popup.find('#first-message-script-inputs-container').empty();
        popup.find('#scenario-script-inputs-container').empty();
        popup.find('#personality-script-inputs-container').empty();
        popup.find('#character-note-script-inputs-container').empty();
        // Reset previews
        popup.find('#description-preview').text('Preview will appear here...');
        popup.find('#first-message-preview').text('Preview will appear here...');
        popup.find('#scenario-preview').text('Preview will appear here...');
        popup.find('#personality-preview').text('Preview will appear here...');
        popup.find('#character-note-preview').text('Preview will appear here...');
        // Switch to description tab
        switchTab('description');
        // Save the empty state
        saveScenarioCreateData(createEmptyScenarioCreateData());
    });
}
/**
 * Sets up the import button functionality
 */
function setupImportButton(popup) {
    // Create hidden file input
    const fileInput = $('<input type="file" accept=".json" style="display: none">');
    popup.append(fileInput);
    // Handle import button click
    popup.find('#import-scenario-btn').on('click', function () {
        fileInput.trigger('click');
    });
    // Handle file selection
    fileInput.on('change', function (e) {
        const file = e.target.files[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = async function (event) {
            if (!event.target?.result) {
                return;
            }
            try {
                const importedData = JSON.parse(event.target.result);
                const scenarioData = await convertImportedData(importedData);
                if (!scenarioData) {
                    return;
                }
                // Clear existing data
                popup.find('#dynamic-tab-buttons').empty();
                popup.find('#dynamic-inputs-container').empty();
                // Apply imported data
                applyScenarioCreateDataToUI(popup, scenarioData);
                // Save imported data
                saveScenarioCreateData(scenarioData);
            }
            catch (error) {
                console.error('Import error:', error);
                await stEcho('error', 'Failed to import scenario data. Please check the file and try again.');
            }
        };
        reader.readAsText(file);
        // Reset file input for future imports
        fileInput.val('');
    });
}
/**
 * Sets up the export button functionality
 */
function setupExportButton(popup) {
    popup.find('#export-scenario-btn').on('click', async function () {
        const currentData = getScenarioCreateDataFromUI(popup);
        const formElement = $('#form_create').get(0);
        const formData = new FormData(formElement);
        // Validate all scripts before export
        let errors = [];
        // Check description
        try {
            updatePreview(popup, 'description', true);
        }
        catch (error) {
            errors.push('Description script error: ' + error.message);
        }
        // Check first message
        try {
            updatePreview(popup, 'first-message', true);
        }
        catch (error) {
            errors.push('First message script error: ' + error.message);
        }
        // Check scenario
        try {
            updatePreview(popup, 'scenario', true);
        }
        catch (error) {
            errors.push('Scenario script error: ' + error.message);
        }
        // Check personality
        try {
            updatePreview(popup, 'personality', true);
        }
        catch (error) {
            errors.push('Personality script error: ' + error.message);
        }
        // Check character note
        try {
            updatePreview(popup, 'character-note', true);
        }
        catch (error) {
            errors.push('Character note script error: ' + error.message);
        }
        // Check all question scripts
        const questionGroups = popup.find('.dynamic-input-group');
        questionGroups.each(function () {
            const group = $(this);
            const inputId = group.find('.input-id').val();
            try {
                updateQuestionPreview(group, true);
            }
            catch (error) {
                errors.push(`Question "${inputId}" script error: ${error.message}`);
            }
        });
        // If there are any errors, show them and stop export
        if (errors.length > 0) {
            const errorMessage = 'Export validation failed:\n' + errors.join('\n');
            await stEcho('error', errorMessage);
            return;
        }
        // If all validations pass, create and download the file
        const productionData = createProductionScenarioData(currentData, formData);
        downloadFile(productionData, 'scenario.json');
    });
}

/**
 * Prepares and adds the play scenario button to the character sidebar
 */
async function preparePlayButton() {
    const playScenarioIconHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-play-icon'));
    $('#form_character_search_form').prepend(playScenarioIconHtml);
    const playScenarioIcon = $('#scenario-play-icon');
    playScenarioIcon.on('click', handlePlayScenarioClick);
}
/**
 * Handles click on the play scenario icon
 * Opens file picker to load and play a scenario
 */
async function handlePlayScenarioClick() {
    // Create hidden file input
    const fileInput = $('<input type="file" accept=".json" style="display: none">');
    $('body').append(fileInput);
    // Handle file selection
    fileInput.on('change', async function (e) {
        const file = e.target.files[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = async function (event) {
            if (!event.target)
                return;
            try {
                const scenarioData = JSON.parse(event.target.result);
                if (!scenarioData.scenario_creator) {
                    await stEcho('warning', 'This scenario does not have a creator section');
                    return;
                }
                // Check version changes
                if (scenarioData.scenario_creator.version &&
                    scenarioData.scenario_creator.version !== extensionVersion) {
                    await stEcho('info', `Scenario version changed from ${scenarioData.scenario_creator.version} to ${extensionVersion}`);
                }
                scenarioData.scenario_creator = upgradeOrDowngradeData(scenarioData.scenario_creator, "export");
                setupPlayDialogHandlers(scenarioData);
            }
            catch (error) {
                console.error('Import error:', error);
                stEcho('error', 'Error importing scenario: ' + error.message);
            }
        };
        reader.readAsText(file);
        // Clean up
        fileInput.remove();
    });
    // Trigger file picker
    fileInput.trigger('click');
}
/**
 * Sets up handlers for the play dialog
 */
async function setupPlayDialogHandlers(scenarioData) {
    const scenarioPlayDialogHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-play-dialog'));
    const { descriptionScript, firstMessageScript, scenarioScript, personalityScript, questions, characterNoteScript, } = scenarioData.scenario_creator || {};
    let popup;
    let dynamicInputsContainer;
    let inputTemplate;
    // Set up pagination variables
    let currentPageIndex = 0;
    const layout = scenarioData.scenario_creator.layout || [[...questions.map(q => q.inputId)]];
    const visitedPages = new Set([0]); // Track visited pages, starting with first page
    callGenericPopup(scenarioPlayDialogHtml, POPUP_TYPE.TEXT, '', {
        okButton: true,
        cancelButton: true,
        wider: true,
        onClosing: async (popupInstance) => {
            if (popupInstance.result !== POPUP_RESULT.AFFIRMATIVE) {
                return true;
            }
            // Check if all pages have been visited before allowing cancel
            if (visitedPages.size < layout.length) {
                await stEcho('warning', 'Please view all pages before playing');
                return false;
            }
            // On final submission, validate all fields
            const allAnswers = {};
            let hasValidationErrors = false;
            popup.find('.dynamic-input').each(function () {
                const $input = $(this);
                const id = $input.data('id');
                const required = $input.data('required');
                let value;
                // Handle select elements first
                if ($input.is('select')) {
                    const label = $input.find('option:selected').text();
                    value = { label, value: $input.val() };
                }
                // Then handle other input types
                else
                    switch ($input.attr('type')) {
                        case 'checkbox':
                            value = $input.prop('checked');
                            break;
                        default:
                            value = $input.val();
                    }
                allAnswers[id] = value;
                // Check if required field is empty
                if (required && (value === '' || value === undefined)) {
                    hasValidationErrors = true;
                    $input.closest('.dynamic-input-group')
                        .find('.validation-error')
                        .text('This field is required')
                        .show();
                }
            });
            if (hasValidationErrors) {
                // Find first page with validation error
                for (let i = 0; i < layout.length; i++) {
                    const inputIds = layout[i];
                    const hasError = inputIds.some(inputId => {
                        const wrapper = popup.find(`[data-input-id="${inputId}"]`);
                        return wrapper.find('.validation-error:visible').length > 0;
                    });
                    if (hasError) {
                        currentPageIndex = i;
                        displayCurrentPage();
                        break;
                    }
                }
                return false;
            }
            try {
                // Process description and first message with allAnswers
                const descriptionVars = descriptionScript ?
                    executeScript(descriptionScript, allAnswers) : allAnswers;
                const description = interpolateText(scenarioData.description, descriptionVars);
                const firstMessageVars = firstMessageScript ?
                    executeScript(firstMessageScript, allAnswers) : allAnswers;
                const firstMessage = interpolateText(scenarioData.first_mes, firstMessageVars);
                const scenarioVars = scenarioScript ?
                    executeScript(scenarioScript, allAnswers) : allAnswers;
                const processedScenario = interpolateText(scenarioData.scenario, scenarioVars);
                const personalityVars = personalityScript ?
                    executeScript(personalityScript, allAnswers) : allAnswers;
                const processedPersonality = interpolateText(scenarioData.personality, personalityVars);
                // Update both main and data.scenario fields
                scenarioData.scenario = processedScenario;
                scenarioData.data.scenario = processedScenario;
                // Update both main and data.personality fields
                scenarioData.personality = processedPersonality;
                scenarioData.data.personality = processedPersonality;
                // Add character note script processing and update extensions.depth_prompt.prompt
                if (scenarioData.data.extensions && scenarioData.data.extensions.depth_prompt) {
                    const characterNoteVars = characterNoteScript ?
                        executeScript(characterNoteScript, allAnswers) : allAnswers;
                    const processedCharacterNote = interpolateText(scenarioData.data.extensions.depth_prompt.prompt, characterNoteVars);
                    scenarioData.data.extensions.depth_prompt.prompt = processedCharacterNote;
                }
                // Create form data for character creation
                const formData = new FormData();
                scenarioData.description = description;
                scenarioData.first_mes = firstMessage;
                scenarioData.data.description = description;
                scenarioData.data.first_mes = firstMessage;
                const newFile = new Blob([JSON.stringify(scenarioData)], { type: 'application/json' });
                formData.append('avatar', newFile, 'scenario.json');
                formData.append('file_type', 'json');
                const headers = getRequestHeaders();
                delete headers['Content-Type'];
                const fetchResult = await fetch('/api/characters/import', {
                    method: 'POST',
                    headers: headers,
                    body: formData,
                    cache: 'no-cache',
                });
                if (!fetchResult.ok) {
                    throw new Error('Fetch result is not ok');
                }
                await st_getCharacters();
                await stGo(scenarioData.name);
                return true;
            }
            catch (error) {
                console.error('Error processing scenario:', error);
                await stEcho('error', 'Error processing scenario: ' + error.message);
                return false;
            }
        }
    });
    popup = $('#scenario-play-dialog');
    dynamicInputsContainer = popup.find('#dynamic-inputs-container');
    inputTemplate = popup.find('#dynamic-input-template');
    // Create navigation buttons
    const navigationButtons = $(`
        <div class="flex-container justifySpaceBetween">
            <button id="prev-page" class="menu_button" style="display: none">Previous</button>
            <div id="page-indicator"></div>
            <button id="next-page" class="menu_button">Next</button>
        </div>
    `);
    dynamicInputsContainer.before(navigationButtons);
    // Navigation button handlers
    const prevButton = navigationButtons.find('#prev-page');
    const nextButton = navigationButtons.find('#next-page');
    const pageIndicator = navigationButtons.find('#page-indicator');
    // Function to validate current page
    function validateCurrentPage() {
        popup.find('.validation-error').hide();
        let hasPageErrors = false;
        const currentPageInputs = popup.find('.dynamic-input').filter((_, el) => layout[currentPageIndex].includes($(el).data('id')));
        currentPageInputs.each(function () {
            const $input = $(this);
            if ($input.data('required')) {
                let value;
                // Handle select elements first
                if ($input.is('select')) {
                    value = $input.val();
                }
                // Then handle other input types
                else
                    switch ($input.attr('type')) {
                        case 'checkbox':
                            value = $input.prop('checked');
                            break;
                        default:
                            value = $input.val();
                    }
                if (value === '' || value === undefined) {
                    hasPageErrors = true;
                    $input.closest('.dynamic-input-group')
                        .find('.validation-error')
                        .text('This field is required')
                        .show();
                }
            }
        });
        return !hasPageErrors;
    }
    // Function to handle page navigation
    function navigateToPage(targetIndex) {
        if (targetIndex >= 0 && targetIndex < layout.length) {
            if (targetIndex > currentPageIndex && !validateCurrentPage()) {
                return;
            }
            currentPageIndex = targetIndex;
            displayCurrentPage();
        }
    }
    prevButton.on('click', () => navigateToPage(currentPageIndex - 1));
    nextButton.on('click', () => navigateToPage(currentPageIndex + 1));
    /**
     * Updates the question text based on dynamic input values and script execution.
     * @throws {Error} When script execution fails
     */
    function updateQuestionText(questionWrapper, question) {
        const answers = {};
        popup.find('.dynamic-input').each(function () {
            const $input = $(this);
            const id = $input.data('id');
            // Handle select elements first
            if ($input.is('select')) {
                const label = $input.find('option:selected').text();
                answers[id] = { label, value: $input.val() };
            }
            // Then handle other input types
            else
                switch ($input.attr('type')) {
                    case 'checkbox':
                        answers[id] = $input.prop('checked');
                        break;
                    default:
                        answers[id] = $input.val();
                }
        });
        try {
            const variables = question.script ? executeScript(question.script, answers) : answers;
            const interpolated = interpolateText(question.text, variables);
            questionWrapper.find('.input-question').text(interpolated + (question.required ? ' *' : ''));
        }
        catch (error) {
            console.error('Question text update error:', error);
            questionWrapper.find('.input-question').text(question.text + (question.required ? ' *' : '') +
                ` (Script error: ${error.message})`);
        }
    }
    // Create all inputs at initialization
    function createAllInputs() {
        questions.forEach(question => {
            const newInput = $(inputTemplate.html());
            newInput.addClass('dynamic-input-wrapper');
            newInput.attr('data-input-id', question.inputId);
            const inputContainer = newInput.find('.input-container');
            const inputAttrs = {
                'data-id': question.inputId,
                'data-required': question.required || false
            };
            switch (question.type) {
                case 'checkbox':
                    inputContainer.html(`
                    <label class="checkbox_label">
                        <input type="checkbox" class="dynamic-input"
                            ${Object.entries(inputAttrs).map(([key, val]) => `${key}="${val}"`).join(' ')}
                            ${question.defaultValue ? 'checked' : ''}>
                    </label>
                `);
                    break;
                case 'select':
                    const selectHtml = `
                    <select class="text_pole dynamic-input"
                        ${Object.entries(inputAttrs).map(([key, val]) => `${key}="${val}"`).join(' ')}>
                        ${question.options.map(opt => `<option value="${opt.value}" ${opt.value === question.defaultValue ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                `;
                    inputContainer.html(selectHtml);
                    break;
                default: // text
                    inputContainer.html(`
                    <input type="text" class="text_pole dynamic-input"
                        ${Object.entries(inputAttrs).map(([key, val]) => `${key}="${val}"`).join(' ')}
                        value="${question.defaultValue || ''}"
                        placeholder="${question.required ? 'Required' : 'Enter your answer'}">
                `);
                    break;
            }
            dynamicInputsContainer.append(newInput);
            // Set initial question text
            updateQuestionText(newInput, question);
            // Update question text when any input changes
            popup.find('.dynamic-input').on('input change', function () {
                questions.forEach(q => {
                    const wrapper = dynamicInputsContainer.find(`[data-input-id="${q.inputId}"]`);
                    updateQuestionText(wrapper, q);
                });
            });
        });
    }
    // Function to display current page by showing/hiding inputs
    function displayCurrentPage() {
        // Hide all inputs first
        dynamicInputsContainer.find('.dynamic-input-wrapper').hide();
        // Show only inputs for current page
        const currentPageQuestions = questions.filter(q => layout[currentPageIndex].includes(q.inputId));
        currentPageQuestions.forEach(question => {
            const wrapper = dynamicInputsContainer.find(`[data-input-id="${question.inputId}"]`);
            wrapper.show();
            updateQuestionText(wrapper, question);
        });
        // Update navigation and track visited pages
        visitedPages.add(currentPageIndex);
        prevButton.toggle(currentPageIndex > 0);
        nextButton.toggle(currentPageIndex < layout.length - 1);
        pageIndicator.text(`Page ${currentPageIndex + 1} of ${layout.length}`);
    }
    // Create all inputs and display first page
    createAllInputs();
    displayCurrentPage();
}

jQuery(async () => {
    await prepareCharacterSidebar();
    await preparePlayButton();
});
