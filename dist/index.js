var global = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : undefined;

import { uuidv4 } from '../../../../utils.js';
import { getCharacters, saveCharacterDebounced, extension_prompt_roles, getThumbnailUrl } from '../../../../../script.js';
import { humanizedDateTime } from '../../../../RossAscends-mods.js';
import { Popper } from '../../../../../lib.js';
import { getContext } from '../../../../extensions.js';
import { checkEmbeddedWorld, importEmbeddedWorldInfo, world_names, loadWorldInfo, newWorldInfoEntryTemplate, world_info_position, DEFAULT_DEPTH, world_info_logic, DEFAULT_WEIGHT, saveWorldInfo, setWorldInfoButtonClass } from '../../../../world-info.js';

// @ts-ignore
const extensionName = 'SillyTavern-Custom-Scenario';
const extensionVersion = '0.3.5';
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
function st_getRequestHeaders() {
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
async function st_updateCharacters() {
    return await getCharacters();
}
// TODO: Get from getContext()
function st_humanizedDateTime() {
    return humanizedDateTime();
}
function st_createPopper(reference, popper, options) {
    return Popper.createPopper(reference, popper, options);
}
/**
 * Note: It doesn't contain the scenario data.
 */
function st_getCharacters() {
    return getContext().characters;
}
function st_checkEmbeddedWorld(chid) {
    return checkEmbeddedWorld(chid);
}
async function st_importEmbeddedWorldInfo(skipPopup = false) {
    return await importEmbeddedWorldInfo(skipPopup);
}
function st_saveCharacterDebounced() {
    return saveCharacterDebounced();
}
function st_getWorldNames() {
    return world_names;
}
async function st_getWorldInfo(worldName) {
    return await loadWorldInfo(worldName);
}
// https://github.com/SillyTavern/SillyTavern/blob/999da4945aaf1da6f6d4ff1e9e314c11f0ccfeb1/src/endpoints/characters.js#L466
function st_server_convertWorldInfoToCharacterBook(name, entries) {
    const result = { entries: [], name };
    for (const index in entries) {
        const entry = entries[index];
        const originalEntry = {
            id: entry.uid,
            keys: entry.key,
            secondary_keys: entry.keysecondary,
            comment: entry.comment,
            content: entry.content,
            constant: entry.constant,
            selective: entry.selective,
            insertion_order: entry.order,
            enabled: !entry.disable,
            position: entry.position == 0 ? 'before_char' : 'after_char',
            use_regex: true, // ST keys are always regex
            extensions: {
                ...entry.extensions,
                position: entry.position,
                exclude_recursion: entry.excludeRecursion,
                display_index: entry.displayIndex,
                probability: entry.probability ?? null,
                useProbability: entry.useProbability ?? false,
                depth: entry.depth ?? 4,
                selectiveLogic: entry.selectiveLogic ?? 0,
                group: entry.group ?? '',
                group_override: entry.groupOverride ?? false,
                group_weight: entry.groupWeight ?? null,
                prevent_recursion: entry.preventRecursion ?? false,
                delay_until_recursion: entry.delayUntilRecursion ?? false,
                scan_depth: entry.scanDepth ?? null,
                match_whole_words: entry.matchWholeWords ?? null,
                use_group_scoring: entry.useGroupScoring ?? false,
                case_sensitive: entry.caseSensitive ?? null,
                automation_id: entry.automationId ?? '',
                role: entry.role ?? 0,
                vectorized: entry.vectorized ?? false,
                sticky: entry.sticky ?? null,
                cooldown: entry.cooldown ?? null,
                delay: entry.delay ?? null,
            },
        };
        result.entries.push(originalEntry);
    }
    return result;
}
// https://github.com/SillyTavern/SillyTavern/blob/1d5cf8d25c738801b8a922df4a4e290122719733/public/scripts/world-info.js#L4661
function st_convertCharacterBook(characterBook) {
    const result = { entries: {}, originalData: characterBook };
    characterBook.entries.forEach((entry, index) => {
        // Not in the spec, but this is needed to find the entry in the original data
        if (entry.id === undefined) {
            entry.id = index;
        }
        // @ts-ignore
        result.entries[entry.id] = {
            ...newWorldInfoEntryTemplate,
            uid: entry.id,
            key: entry.keys,
            keysecondary: entry.secondary_keys || [],
            comment: entry.comment || '',
            content: entry.content,
            constant: entry.constant || false,
            selective: entry.selective || false,
            order: entry.insertion_order,
            position: entry.extensions?.position ??
                (entry.position === 'before_char' ? world_info_position.before : world_info_position.after),
            excludeRecursion: entry.extensions?.exclude_recursion ?? false,
            preventRecursion: entry.extensions?.prevent_recursion ?? false,
            delayUntilRecursion: entry.extensions?.delay_until_recursion ?? false,
            disable: !entry.enabled,
            addMemo: !!entry.comment,
            displayIndex: entry.extensions?.display_index ?? index,
            probability: entry.extensions?.probability ?? 100,
            useProbability: entry.extensions?.useProbability ?? true,
            depth: entry.extensions?.depth ?? DEFAULT_DEPTH,
            selectiveLogic: entry.extensions?.selectiveLogic ?? world_info_logic.AND_ANY,
            group: entry.extensions?.group ?? '',
            groupOverride: entry.extensions?.group_override ?? false,
            groupWeight: entry.extensions?.group_weight ?? DEFAULT_WEIGHT,
            scanDepth: entry.extensions?.scan_depth ?? null,
            caseSensitive: entry.extensions?.case_sensitive ?? null,
            matchWholeWords: entry.extensions?.match_whole_words ?? null,
            useGroupScoring: entry.extensions?.use_group_scoring ?? null,
            automationId: entry.extensions?.automation_id ?? '',
            role: entry.extensions?.role ?? extension_prompt_roles.SYSTEM,
            vectorized: entry.extensions?.vectorized ?? false,
            sticky: entry.extensions?.sticky ?? null,
            cooldown: entry.extensions?.cooldown ?? null,
            delay: entry.extensions?.delay ?? null,
            extensions: entry.extensions ?? {},
        };
    });
    return result;
}
function st_saveWorldInfo(name, data, immediately = false) {
    return saveWorldInfo(name, data, immediately);
}
// export async function st_updateWorldInfoList() {
//   return await updateWorldInfoList();
// }
function st_setWorldInfoButtonClass(chid, forceValue) {
    setWorldInfoButtonClass(chid, forceValue);
}
function st_getThumbnailUrl(type, file) {
    return getThumbnailUrl(type, file);
}

/**
 * @param emptyStrategy if it's variableName, null/undefined/empty values would be shown as `{{variable}}`. Otherwise, it will show as empty strings.
 */
function executeMainScript(script, answers, emptyStrategy) {
    // Clone answers to avoid modifying the original object
    const variables = JSON.parse(JSON.stringify(answers));
    // First interpolate any variables in the script
    const interpolatedScript = interpolateText(script, variables, emptyStrategy);
    // Create a function that returns all variables
    const scriptFunction = new Function('answers', `
        let variables = JSON.parse(JSON.stringify(${JSON.stringify(variables)}));
        ${interpolatedScript}
        return variables;
    `);
    return scriptFunction(variables);
}
/**
 * @param emptyStrategy if it's variableName, null/undefined/empty values would be shown as `{{variable}}`. Otherwise, it will show as empty strings.
 */
function executeShowScript(script, answers, emptyStrategy) {
    // Clone answers to avoid modifying the original object
    const variables = JSON.parse(JSON.stringify(answers));
    // First interpolate any variables in the script
    const interpolatedScript = interpolateText(script, variables, emptyStrategy);
    // Create a function that returns all variables
    const scriptFunction = new Function('answers', `
        let variables = JSON.parse(JSON.stringify(${JSON.stringify(variables)}));
        ${interpolatedScript}
    `);
    return scriptFunction(variables);
}
/**
 * @param emptyStrategy if it's variableName, null/undefined/empty values would be shown as `{{variable}}`. Otherwise, it will show as empty strings.
 */
function interpolateText(template, variables, emptyStrategy) {
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
            let value = newVariables[key];
            if (typeof value === 'string') {
                value = value.trim();
            }
            if (emptyStrategy === 'variableName' && (value === undefined || value === null || value === '')) {
                return match; // Keep original if variable is undefined, null, or empty
            }
            else if (!value) {
                return '';
            }
            // Recursively interpolate if the variable contains template syntax
            return value.toString().includes('{{') ? interpolateText(value.toString(), newVariables, emptyStrategy) : value;
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
        description: {
            contentId: '#scenario-creator-character-description',
            scriptId: '#scenario-creator-script',
            previewId: '#description-preview',
            scriptInputsId: '#script-inputs-container',
        },
        'first-message': {
            contentId: '#scenario-creator-character-first-message',
            scriptId: '#scenario-creator-first-message-script',
            previewId: '#first-message-preview',
            scriptInputsId: '#first-message-script-inputs-container',
        },
        scenario: {
            contentId: '#scenario-creator-character-scenario',
            scriptId: '#scenario-creator-scenario-script',
            previewId: '#scenario-preview',
            scriptInputsId: '#scenario-script-inputs-container',
        },
        personality: {
            contentId: '#scenario-creator-character-personality',
            scriptId: '#scenario-creator-personality-script',
            previewId: '#personality-preview',
            scriptInputsId: '#personality-script-inputs-container',
        },
        'character-note': {
            contentId: '#scenario-creator-character-note',
            scriptId: '#scenario-creator-character-note-script',
            previewId: '#character-note-preview',
            scriptInputsId: '#character-note-script-inputs-container',
        },
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
        const variables = script ? executeMainScript(script, answers, 'remove') : answers;
        // Interpolate content with variables
        const interpolated = interpolateText(content, variables, 'variableName');
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
    const mainScriptText = questionGroup.find('.question-script').val();
    const showScriptText = questionGroup.find('.show-script').val();
    const mainPreviewDiv = questionGroup.find('.question-preview');
    const showPreviewDiv = questionGroup.find('.show-preview');
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
        const variables = mainScriptText ? executeMainScript(mainScriptText, answers, 'remove') : answers;
        // Interpolate content with variables
        const interpolated = interpolateText(questionText, variables, 'variableName');
        mainPreviewDiv.text(interpolated);
    }
    catch (error) {
        console.error('Question preview update/script execute error:', error);
        mainPreviewDiv.text(`Question preview update/script execute error: ${error.message}`);
        if (rethrowError) {
            throw error;
        }
    }
    // Update show script preview
    try {
        // Execute script if exists
        const result = showScriptText ? executeShowScript(showScriptText, answers, 'remove') : true;
        showPreviewDiv.text(result ? 'SHOW' : 'HIDE');
    }
    catch (error) {
        console.error('Show script preview update/script execute error:', error);
        showPreviewDiv.text(`Show script preview update/script execute error: ${error.message}`);
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
        version: extensionVersion,
    };
}
function createEmptyScenarioExportData() {
    return {
        ...createEmptyScenarioCreateData(),
    };
}
const versionUpgrades = [
    {
        from: '0.2.0',
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
        },
    },
    {
        from: '0.2.1',
        to: '0.3.0',
        createCallback: (data) => {
            data.version = '0.3.0';
        },
        exportCallback: (data) => {
            data.version = '0.3.0';
        },
    },
    {
        from: '0.3.0',
        to: '0.3.1',
        createCallback: (data) => {
            data.version = '0.3.1';
        },
        exportCallback: (data) => {
            data.version = '0.3.1';
        },
    },
    {
        from: '0.3.1',
        to: '0.3.2',
        createCallback: (data) => {
            data.version = '0.3.2';
        },
        exportCallback: (data) => {
            data.version = '0.3.2';
        },
    },
    {
        from: '0.3.2',
        to: '0.3.3',
        createCallback: (data) => {
            data.version = '0.3.3';
        },
        exportCallback: (data) => {
            data.version = '0.3.3';
        },
    },
    {
        from: '0.3.3',
        to: '0.3.4',
        createCallback: (data) => {
            // Add showScript to questions if it doesn't exist
            data.questions.forEach((question) => {
                if (!question.showScript) {
                    question.showScript = '';
                }
            });
            data.version = '0.3.4';
        },
        exportCallback: (data) => {
            // Add showScript to questions if it doesn't exist
            data.questions.forEach((question) => {
                if (!question.showScript) {
                    question.showScript = '';
                }
            });
            data.version = '0.3.4';
        },
    },
    {
        from: '0.3.4',
        to: '0.3.5',
        createCallback: (data) => {
            data.version = '0.3.5';
        },
        exportCallback: (data) => {
            data.version = '0.3.5';
        },
    },
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

var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var inited = false;
function init () {
  inited = true;
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }

  revLookup['-'.charCodeAt(0)] = 62;
  revLookup['_'.charCodeAt(0)] = 63;
}

function toByteArray (b64) {
  if (!inited) {
    init();
  }
  var i, j, l, tmp, placeHolders, arr;
  var len = b64.length;

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders);

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len;

  var L = 0;

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
    arr[L++] = (tmp >> 16) & 0xFF;
    arr[L++] = (tmp >> 8) & 0xFF;
    arr[L++] = tmp & 0xFF;
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
    arr[L++] = tmp & 0xFF;
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
    arr[L++] = (tmp >> 8) & 0xFF;
    arr[L++] = tmp & 0xFF;
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp;
  var output = [];
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
    output.push(tripletToBase64(tmp));
  }
  return output.join('')
}

function fromByteArray (uint8) {
  if (!inited) {
    init();
  }
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
  var output = '';
  var parts = [];
  var maxChunkLength = 16383; // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    output += lookup[tmp >> 2];
    output += lookup[(tmp << 4) & 0x3F];
    output += '==';
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
    output += lookup[tmp >> 10];
    output += lookup[(tmp >> 4) & 0x3F];
    output += lookup[(tmp << 2) & 0x3F];
    output += '=';
  }

  parts.push(output);

  return parts.join('')
}

function read (buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? (nBytes - 1) : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

function write (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
  var i = isLE ? 0 : (nBytes - 1);
  var d = isLE ? 1 : -1;
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128;
}

var toString = {}.toString;

var isArray = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */


var INSPECT_MAX_BYTES = 50;

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer$1.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : true;

/*
 * Export kMaxLength after typed array support is determined.
 */
kMaxLength();

function kMaxLength () {
  return Buffer$1.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length);
    that.__proto__ = Buffer$1.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer$1(length);
    }
    that.length = length;
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer$1 (arg, encodingOrOffset, length) {
  if (!Buffer$1.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer$1)) {
    return new Buffer$1(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer$1.poolSize = 8192; // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer$1._augment = function (arr) {
  arr.__proto__ = Buffer$1.prototype;
  return arr
};

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer$1.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
};

if (Buffer$1.TYPED_ARRAY_SUPPORT) {
  Buffer$1.prototype.__proto__ = Uint8Array.prototype;
  Buffer$1.__proto__ = Uint8Array;
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer$1[Symbol.species] === Buffer$1) ;
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size);
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer$1.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
};

function allocUnsafe (that, size) {
  assertSize(size);
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
  if (!Buffer$1.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0;
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer$1.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
};
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer$1.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
};

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8';
  }

  if (!Buffer$1.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0;
  that = createBuffer(that, length);

  var actual = that.write(string, encoding);

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual);
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0;
  that = createBuffer(that, length);
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255;
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength; // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array);
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset);
  } else {
    array = new Uint8Array(array, byteOffset, length);
  }

  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array;
    that.__proto__ = Buffer$1.prototype;
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array);
  }
  return that
}

function fromObject (that, obj) {
  if (internalIsBuffer(obj)) {
    var len = checked(obj.length) | 0;
    that = createBuffer(that, len);

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len);
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}
Buffer$1.isBuffer = isBuffer;
function internalIsBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer$1.compare = function compare (a, b) {
  if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

Buffer$1.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
};

Buffer$1.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer$1.alloc(0)
  }

  var i;
  if (length === undefined) {
    length = 0;
    for (i = 0; i < list.length; ++i) {
      length += list[i].length;
    }
  }

  var buffer = Buffer$1.allocUnsafe(length);
  var pos = 0;
  for (i = 0; i < list.length; ++i) {
    var buf = list[i];
    if (!internalIsBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer
};

function byteLength (string, encoding) {
  if (internalIsBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string;
  }

  var len = string.length;
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
}
Buffer$1.byteLength = byteLength;

function slowToString (encoding, start, end) {
  var loweredCase = false;

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0;
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length;
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0;
  start >>>= 0;

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8';

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase();
        loweredCase = true;
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer$1.prototype._isBuffer = true;

function swap (b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}

Buffer$1.prototype.swap16 = function swap16 () {
  var len = this.length;
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1);
  }
  return this
};

Buffer$1.prototype.swap32 = function swap32 () {
  var len = this.length;
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }
  return this
};

Buffer$1.prototype.swap64 = function swap64 () {
  var len = this.length;
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }
  return this
};

Buffer$1.prototype.toString = function toString () {
  var length = this.length | 0;
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
};

Buffer$1.prototype.equals = function equals (b) {
  if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer$1.compare(this, b) === 0
};

Buffer$1.prototype.inspect = function inspect () {
  var str = '';
  var max = INSPECT_MAX_BYTES;
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
    if (this.length > max) str += ' ... ';
  }
  return '<Buffer ' + str + '>'
};

Buffer$1.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!internalIsBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0;
  }
  if (end === undefined) {
    end = target ? target.length : 0;
  }
  if (thisStart === undefined) {
    thisStart = 0;
  }
  if (thisEnd === undefined) {
    thisEnd = this.length;
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;

  if (this === target) return 0

  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);

  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i];
      y = targetCopy[i];
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
};

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff;
  } else if (byteOffset < -2147483648) {
    byteOffset = -2147483648;
  }
  byteOffset = +byteOffset;  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1);
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer$1.from(val, encoding);
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (internalIsBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF; // Search for a byte value [0-255]
    if (Buffer$1.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase();
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i;
  if (dir) {
    var foundIndex = -1;
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i;
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex;
        foundIndex = -1;
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
    for (i = byteOffset; i >= 0; i--) {
      var found = true;
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false;
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer$1.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
};

Buffer$1.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
};

Buffer$1.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
};

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = Number(length);
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed;
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer$1.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8';
    length = this.length;
    offset = 0;
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset;
    length = this.length;
    offset = 0;
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0;
    if (isFinite(length)) {
      length = length | 0;
      if (encoding === undefined) encoding = 'utf8';
    } else {
      encoding = length;
      length = undefined;
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset;
  if (length === undefined || length > remaining) length = remaining;

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8';

  var loweredCase = false;
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase();
        loweredCase = true;
    }
  }
};

Buffer$1.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
};

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return fromByteArray(buf)
  } else {
    return fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];

  var i = start;
  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }
          break
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    res.push(codePoint);
    i += bytesPerSequence;
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000;

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = '';
  var i = 0;
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    );
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F);
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = '';
  end = Math.min(buf.length, end);

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i]);
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i]);
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = '';
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  }
  return res
}

Buffer$1.prototype.slice = function slice (start, end) {
  var len = this.length;
  start = ~~start;
  end = end === undefined ? len : ~~end;

  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) {
    start = len;
  }

  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) {
    end = len;
  }

  if (end < start) end = start;

  var newBuf;
  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end);
    newBuf.__proto__ = Buffer$1.prototype;
  } else {
    var sliceLen = end - start;
    newBuf = new Buffer$1(sliceLen, undefined);
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start];
    }
  }

  return newBuf
};

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer$1.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }

  return val
};

Buffer$1.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length);
  }

  var val = this[offset + --byteLength];
  var mul = 1;
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul;
  }

  return val
};

Buffer$1.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  return this[offset]
};

Buffer$1.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] | (this[offset + 1] << 8)
};

Buffer$1.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return (this[offset] << 8) | this[offset + 1]
};

Buffer$1.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
};

Buffer$1.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
};

Buffer$1.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer$1.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) checkOffset(offset, byteLength, this.length);

  var i = byteLength;
  var mul = 1;
  var val = this[offset + --i];
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul;
  }
  mul *= 0x80;

  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

  return val
};

Buffer$1.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
};

Buffer$1.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset] | (this[offset + 1] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer$1.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset + 1] | (this[offset] << 8);
  return (val & 0x8000) ? val | 0xFFFF0000 : val
};

Buffer$1.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
};

Buffer$1.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
};

Buffer$1.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, true, 23, 4)
};

Buffer$1.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, false, 23, 4)
};

Buffer$1.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, true, 52, 8)
};

Buffer$1.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, false, 52, 8)
};

function checkInt (buf, value, offset, ext, max, min) {
  if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer$1.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var mul = 1;
  var i = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer$1.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength = byteLength | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
    checkInt(this, value, offset, byteLength, maxBytes, 0);
  }

  var i = byteLength - 1;
  var mul = 1;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF;
  }

  return offset + byteLength
};

Buffer$1.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
  if (!Buffer$1.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  this[offset] = (value & 0xff);
  return offset + 1
};

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8;
  }
}

Buffer$1.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2
};

Buffer$1.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2
};

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
  }
}

Buffer$1.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24);
    this[offset + 2] = (value >>> 16);
    this[offset + 1] = (value >>> 8);
    this[offset] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4
};

Buffer$1.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4
};

Buffer$1.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 0xFF;
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer$1.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1);

    checkInt(this, value, offset, byteLength, limit - 1, -limit);
  }

  var i = byteLength - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 0xFF;
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1;
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
  }

  return offset + byteLength
};

Buffer$1.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -128);
  if (!Buffer$1.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  if (value < 0) value = 0xff + value + 1;
  this[offset] = (value & 0xff);
  return offset + 1
};

Buffer$1.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -32768);
  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
  } else {
    objectWriteUInt16(this, value, offset, true);
  }
  return offset + 2
};

Buffer$1.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -32768);
  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8);
    this[offset + 1] = (value & 0xff);
  } else {
    objectWriteUInt16(this, value, offset, false);
  }
  return offset + 2
};

Buffer$1.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -2147483648);
  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff);
    this[offset + 1] = (value >>> 8);
    this[offset + 2] = (value >>> 16);
    this[offset + 3] = (value >>> 24);
  } else {
    objectWriteUInt32(this, value, offset, true);
  }
  return offset + 4
};

Buffer$1.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -2147483648);
  if (value < 0) value = 0xffffffff + value + 1;
  if (Buffer$1.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24);
    this[offset + 1] = (value >>> 16);
    this[offset + 2] = (value >>> 8);
    this[offset + 3] = (value & 0xff);
  } else {
    objectWriteUInt32(this, value, offset, false);
  }
  return offset + 4
};

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4);
  }
  write(buf, value, offset, littleEndian, 23, 4);
  return offset + 4
}

Buffer$1.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
};

Buffer$1.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
};

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8);
  }
  write(buf, value, offset, littleEndian, 52, 8);
  return offset + 8
}

Buffer$1.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
};

Buffer$1.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
};

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer$1.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start;

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length;
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start;
  }

  var len = end - start;
  var i;

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start];
    }
  } else if (len < 1000 || !Buffer$1.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start];
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    );
  }

  return len
};

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer$1.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === 'string') {
      encoding = end;
      end = this.length;
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0);
      if (code < 256) {
        val = code;
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer$1.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255;
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0;
  end = end === undefined ? this.length : end >>> 0;

  if (!val) val = 0;

  var i;
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val;
    }
  } else {
    var bytes = internalIsBuffer(val)
      ? val
      : utf8ToBytes(new Buffer$1(val, encoding).toString());
    var len = bytes.length;
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len];
    }
  }

  return this
};

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '');
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '=';
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue
        }

        // valid lead
        leadSurrogate = codePoint;

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }

    leadSurrogate = null;

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF);
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo;
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }

  return byteArray
}


function base64ToBytes (str) {
  return toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i];
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}


// the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
function isBuffer(obj) {
  return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
}

function isFastBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var sliced;
var hasRequiredSliced;

function requireSliced () {
	if (hasRequiredSliced) return sliced;
	hasRequiredSliced = 1;
	/**
	 * An Array.prototype.slice.call(arguments) alternative
	 *
	 * @param {Object} args something with a length
	 * @param {Number} slice
	 * @param {Number} sliceEnd
	 * @api public
	 */

	sliced = function (args, slice, sliceEnd) {
	  var ret = [];
	  var len = args.length;

	  if (0 === len) return ret;

	  var start = slice < 0
	    ? Math.max(0, slice + len)
	    : slice || 0;

	  if (sliceEnd !== undefined) {
	    len = sliceEnd < 0
	      ? sliceEnd + len
	      : sliceEnd;
	  }

	  while (len-- > start) {
	    ret[len - start] = args[len];
	  }

	  return ret;
	};
	return sliced;
}

var crc32 = {};

/* crc32.js (C) 2014-2015 SheetJS -- http://sheetjs.com */

var hasRequiredCrc32;

function requireCrc32 () {
	if (hasRequiredCrc32) return crc32;
	hasRequiredCrc32 = 1;
	(function (exports) {
		(function (factory) {
			if(typeof DO_NOT_EXPORT_CRC === 'undefined') {
				{
					factory(exports);
				}
			} else {
				factory({});
			}
		}(function(CRC32) {
		CRC32.version = '0.3.0';
		/* see perf/crc32table.js */
		function signed_crc_table() {
			var c = 0, table = new Array(256);

			for(var n =0; n != 256; ++n){
				c = n;
				c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				table[n] = c;
			}

			return typeof Int32Array !== 'undefined' ? new Int32Array(table) : table;
		}

		var table = signed_crc_table();
		/* charCodeAt is the best approach for binary strings */
		var use_buffer = typeof Buffer !== 'undefined';
		function crc32_bstr(bstr) {
			if(bstr.length > 32768) if(use_buffer) return crc32_buf_8(new Buffer(bstr));
			var crc = -1, L = bstr.length - 1;
			for(var i = 0; i < L;) {
				crc =  table[(crc ^ bstr.charCodeAt(i++)) & 0xFF] ^ (crc >>> 8);
				crc =  table[(crc ^ bstr.charCodeAt(i++)) & 0xFF] ^ (crc >>> 8);
			}
			if(i === L) crc = (crc >>> 8) ^ table[(crc ^ bstr.charCodeAt(i)) & 0xFF];
			return crc ^ -1;
		}

		function crc32_buf(buf) {
			if(buf.length > 10000) return crc32_buf_8(buf);
			for(var crc = -1, i = 0, L=buf.length-3; i < L;) {
				crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
				crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
				crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
				crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
			}
			while(i < L+3) crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
			return crc ^ -1;
		}

		function crc32_buf_8(buf) {
			for(var crc = -1, i = 0, L=buf.length-7; i < L;) {
				crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
				crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
				crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
				crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
				crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
				crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
				crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
				crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
			}
			while(i < L+7) crc = (crc >>> 8) ^ table[(crc^buf[i++])&0xFF];
			return crc ^ -1;
		}

		/* much much faster to intertwine utf8 and crc */
		function crc32_str(str) {
			for(var crc = -1, i = 0, L=str.length, c, d; i < L;) {
				c = str.charCodeAt(i++);
				if(c < 0x80) {
					crc = (crc >>> 8) ^ table[(crc ^ c) & 0xFF];
				} else if(c < 0x800) {
					crc = (crc >>> 8) ^ table[(crc ^ (192|((c>>6)&31))) & 0xFF];
					crc = (crc >>> 8) ^ table[(crc ^ (128|(c&63))) & 0xFF];
				} else if(c >= 0xD800 && c < 0xE000) {
					c = (c&1023)+64; d = str.charCodeAt(i++) & 1023;
					crc = (crc >>> 8) ^ table[(crc ^ (240|((c>>8)&7))) & 0xFF];
					crc = (crc >>> 8) ^ table[(crc ^ (128|((c>>2)&63))) & 0xFF];
					crc = (crc >>> 8) ^ table[(crc ^ (128|((d>>6)&15)|(c&3))) & 0xFF];
					crc = (crc >>> 8) ^ table[(crc ^ (128|(d&63))) & 0xFF];
				} else {
					crc = (crc >>> 8) ^ table[(crc ^ (224|((c>>12)&15))) & 0xFF];
					crc = (crc >>> 8) ^ table[(crc ^ (128|((c>>6)&63))) & 0xFF];
					crc = (crc >>> 8) ^ table[(crc ^ (128|(c&63))) & 0xFF];
				}
			}
			return crc ^ -1;
		}
		CRC32.table = table;
		CRC32.bstr = crc32_bstr;
		CRC32.buf = crc32_buf;
		CRC32.str = crc32_str;
		})); 
	} (crc32));
	return crc32;
}

var pngChunksEncode;
var hasRequiredPngChunksEncode;

function requirePngChunksEncode () {
	if (hasRequiredPngChunksEncode) return pngChunksEncode;
	hasRequiredPngChunksEncode = 1;
	var sliced = requireSliced();
	var crc32 = requireCrc32();

	pngChunksEncode = encodeChunks;

	// Used for fast-ish conversion between uint8s and uint32s/int32s.
	// Also required in order to remain agnostic for both Node Buffers and
	// Uint8Arrays.
	var uint8 = new Uint8Array(4);
	var int32 = new Int32Array(uint8.buffer);
	var uint32 = new Uint32Array(uint8.buffer);

	function encodeChunks (chunks) {
	  var totalSize = 8;
	  var idx = totalSize;
	  var i;

	  for (i = 0; i < chunks.length; i++) {
	    totalSize += chunks[i].data.length;
	    totalSize += 12;
	  }

	  var output = new Uint8Array(totalSize);

	  output[0] = 0x89;
	  output[1] = 0x50;
	  output[2] = 0x4E;
	  output[3] = 0x47;
	  output[4] = 0x0D;
	  output[5] = 0x0A;
	  output[6] = 0x1A;
	  output[7] = 0x0A;

	  for (i = 0; i < chunks.length; i++) {
	    var chunk = chunks[i];
	    var name = chunk.name;
	    var data = chunk.data;
	    var size = data.length;
	    var nameChars = [
	      name.charCodeAt(0),
	      name.charCodeAt(1),
	      name.charCodeAt(2),
	      name.charCodeAt(3)
	    ];

	    uint32[0] = size;
	    output[idx++] = uint8[3];
	    output[idx++] = uint8[2];
	    output[idx++] = uint8[1];
	    output[idx++] = uint8[0];

	    output[idx++] = nameChars[0];
	    output[idx++] = nameChars[1];
	    output[idx++] = nameChars[2];
	    output[idx++] = nameChars[3];

	    for (var j = 0; j < size;) {
	      output[idx++] = data[j++];
	    }

	    var crcCheck = nameChars.concat(sliced(data));
	    var crc = crc32.buf(crcCheck);

	    int32[0] = crc;
	    output[idx++] = uint8[3];
	    output[idx++] = uint8[2];
	    output[idx++] = uint8[1];
	    output[idx++] = uint8[0];
	  }

	  return output
	}
	return pngChunksEncode;
}

var pngChunksEncodeExports = requirePngChunksEncode();
var encode = /*@__PURE__*/getDefaultExportFromCjs(pngChunksEncodeExports);

var pngChunksExtract;
var hasRequiredPngChunksExtract;

function requirePngChunksExtract () {
	if (hasRequiredPngChunksExtract) return pngChunksExtract;
	hasRequiredPngChunksExtract = 1;
	var crc32 = requireCrc32();

	pngChunksExtract = extractChunks;

	// Used for fast-ish conversion between uint8s and uint32s/int32s.
	// Also required in order to remain agnostic for both Node Buffers and
	// Uint8Arrays.
	var uint8 = new Uint8Array(4);
	var int32 = new Int32Array(uint8.buffer);
	var uint32 = new Uint32Array(uint8.buffer);

	function extractChunks (data) {
	  if (data[0] !== 0x89) throw new Error('Invalid .png file header')
	  if (data[1] !== 0x50) throw new Error('Invalid .png file header')
	  if (data[2] !== 0x4E) throw new Error('Invalid .png file header')
	  if (data[3] !== 0x47) throw new Error('Invalid .png file header')
	  if (data[4] !== 0x0D) throw new Error('Invalid .png file header: possibly caused by DOS-Unix line ending conversion?')
	  if (data[5] !== 0x0A) throw new Error('Invalid .png file header: possibly caused by DOS-Unix line ending conversion?')
	  if (data[6] !== 0x1A) throw new Error('Invalid .png file header')
	  if (data[7] !== 0x0A) throw new Error('Invalid .png file header: possibly caused by DOS-Unix line ending conversion?')

	  var ended = false;
	  var chunks = [];
	  var idx = 8;

	  while (idx < data.length) {
	    // Read the length of the current chunk,
	    // which is stored as a Uint32.
	    uint8[3] = data[idx++];
	    uint8[2] = data[idx++];
	    uint8[1] = data[idx++];
	    uint8[0] = data[idx++];

	    // Chunk includes name/type for CRC check (see below).
	    var length = uint32[0] + 4;
	    var chunk = new Uint8Array(length);
	    chunk[0] = data[idx++];
	    chunk[1] = data[idx++];
	    chunk[2] = data[idx++];
	    chunk[3] = data[idx++];

	    // Get the name in ASCII for identification.
	    var name = (
	      String.fromCharCode(chunk[0]) +
	      String.fromCharCode(chunk[1]) +
	      String.fromCharCode(chunk[2]) +
	      String.fromCharCode(chunk[3])
	    );

	    // The IHDR header MUST come first.
	    if (!chunks.length && name !== 'IHDR') {
	      throw new Error('IHDR header missing')
	    }

	    // The IEND header marks the end of the file,
	    // so on discovering it break out of the loop.
	    if (name === 'IEND') {
	      ended = true;
	      chunks.push({
	        name: name,
	        data: new Uint8Array(0)
	      });

	      break
	    }

	    // Read the contents of the chunk out of the main buffer.
	    for (var i = 4; i < length; i++) {
	      chunk[i] = data[idx++];
	    }

	    // Read out the CRC value for comparison.
	    // It's stored as an Int32.
	    uint8[3] = data[idx++];
	    uint8[2] = data[idx++];
	    uint8[1] = data[idx++];
	    uint8[0] = data[idx++];

	    var crcActual = int32[0];
	    var crcExpect = crc32.buf(chunk);
	    if (crcExpect !== crcActual) {
	      throw new Error(
	        'CRC values for ' + name + ' header do not match, PNG file is likely corrupted'
	      )
	    }

	    // The chunk data is now copied to remove the 4 preceding
	    // bytes used for the chunk name/type.
	    var chunkData = new Uint8Array(chunk.buffer.slice(4));

	    chunks.push({
	      name: name,
	      data: chunkData
	    });
	  }

	  if (!ended) {
	    throw new Error('.png file ended prematurely: no IEND header was found')
	  }

	  return chunks
	}
	return pngChunksExtract;
}

var pngChunksExtractExports = requirePngChunksExtract();
var extract = /*@__PURE__*/getDefaultExportFromCjs(pngChunksExtractExports);

var pngChunkText = {};

var encode_1;
var hasRequiredEncode;

function requireEncode () {
	if (hasRequiredEncode) return encode_1;
	hasRequiredEncode = 1;
	encode_1 = encode;

	function encode (keyword, content) {
	  keyword = String(keyword);
	  content = String(content);

	  if (!/^[\x00-\xFF]+$/.test(keyword) || !/^[\x00-\xFF]+$/.test(content)) {
	    throw new Error('Only Latin-1 characters are permitted in PNG tEXt chunks. You might want to consider base64 encoding and/or zEXt compression')
	  }

	  if (keyword.length >= 80) {
	    throw new Error('Keyword "' + keyword + '" is longer than the 79-character limit imposed by the PNG specification')
	  }

	  var totalSize = keyword.length + content.length + 1;
	  var output = new Uint8Array(totalSize);
	  var idx = 0;
	  var code;

	  for (var i = 0; i < keyword.length; i++) {
	    if (!(code = keyword.charCodeAt(i))) {
	      throw new Error('0x00 character is not permitted in tEXt keywords')
	    }

	    output[idx++] = code;
	  }

	  output[idx++] = 0;

	  for (var j = 0; j < content.length; j++) {
	    if (!(code = content.charCodeAt(j))) {
	      throw new Error('0x00 character is not permitted in tEXt content')
	    }

	    output[idx++] = code;
	  }

	  return {
	    name: 'tEXt',
	    data: output
	  }
	}
	return encode_1;
}

var decode_1;
var hasRequiredDecode;

function requireDecode () {
	if (hasRequiredDecode) return decode_1;
	hasRequiredDecode = 1;
	decode_1 = decode;

	function decode (data) {
	  if (data.data && data.name) {
	    data = data.data;
	  }

	  var naming = true;
	  var text = '';
	  var name = '';

	  for (var i = 0; i < data.length; i++) {
	    var code = data[i];

	    if (naming) {
	      if (code) {
	        name += String.fromCharCode(code);
	      } else {
	        naming = false;
	      }
	    } else {
	      if (code) {
	        text += String.fromCharCode(code);
	      } else {
	        throw new Error('Invalid NULL character found. 0x00 character is not permitted in tEXt content')
	      }
	    }
	  }

	  return {
	    keyword: name,
	    text: text
	  }
	}
	return decode_1;
}

var hasRequiredPngChunkText;

function requirePngChunkText () {
	if (hasRequiredPngChunkText) return pngChunkText;
	hasRequiredPngChunkText = 1;
	pngChunkText.encode = requireEncode();
	pngChunkText.decode = requireDecode();
	return pngChunkText;
}

var pngChunkTextExports = requirePngChunkText();
var PNGtext = /*@__PURE__*/getDefaultExportFromCjs(pngChunkTextExports);

// Very similar to https://github.com/SillyTavern/SillyTavern/blob/4fcad0752f6e03d4796cda9838f96604298e02e9/src/character-card-parser.js
/**
 * Writes Character metadata to a PNG image buffer.
 * Writes only 'chara', 'ccv3' is not supported and removed not to create a mismatch.
 * @param image PNG image buffer
 * @param data Character data to write
 * @returns PNG image buffer with metadata
 */
function writeScenarioToPng(image, data) {
    const chunks = extract(new Uint8Array(image));
    const tEXtChunks = chunks.filter((chunk) => chunk.name === 'tEXt');
    // Remove existing tEXt chunks
    for (const tEXtChunk of tEXtChunks) {
        const chunkData = PNGtext.decode(tEXtChunk.data);
        if (chunkData.keyword.toLowerCase() === 'chara' || chunkData.keyword.toLowerCase() === 'ccv3') {
            chunks.splice(chunks.indexOf(tEXtChunk), 1);
        }
    }
    // Add new v2 chunk before the IEND chunk
    const base64EncodedData = Buffer$1.from(JSON.stringify(data), 'utf8').toString('base64');
    chunks.splice(-1, 0, PNGtext.encode('chara', base64EncodedData));
    // Try adding v3 chunk before the IEND chunk
    try {
        // change v2 format to v3
        const v3Data = { ...data };
        // @ts-ignore
        v3Data.spec = 'chara_card_v3';
        // @ts-ignore
        v3Data.spec_version = '3.0';
        const base64EncodedDataV3 = Buffer$1.from(JSON.stringify(v3Data), 'utf8').toString('base64');
        chunks.splice(-1, 0, PNGtext.encode('ccv3', base64EncodedDataV3));
    }
    catch (error) {
        // Ignore errors when adding v3 chunk
    }
    return Buffer$1.from(encode(chunks)).buffer;
}
/**
 * Reads Character metadata from a PNG image buffer.
 * Supports both V2 (chara) and V3 (ccv3). V3 (ccv3) takes precedence.
 * @param image PNG image buffer
 * @returns Character data
 * @throws Error if no PNG metadata or character data is found
 */
function readScenarioFromPng(image) {
    const chunks = extract(new Uint8Array(image));
    const textChunks = chunks.filter((chunk) => chunk.name === 'tEXt').map((chunk) => PNGtext.decode(chunk.data));
    if (textChunks.length === 0) {
        console.error('PNG metadata does not contain any text chunks.');
        throw new Error('No PNG metadata.');
    }
    const ccv3Index = textChunks.findIndex((chunk) => chunk.keyword.toLowerCase() === 'ccv3');
    if (ccv3Index > -1) {
        const data = Buffer$1.from(textChunks[ccv3Index].text, 'base64').toString('utf8');
        return JSON.parse(data);
    }
    const charaIndex = textChunks.findIndex((chunk) => chunk.keyword.toLowerCase() === 'chara');
    if (charaIndex > -1) {
        const data = Buffer$1.from(textChunks[charaIndex].text, 'base64').toString('utf8');
        return JSON.parse(data);
    }
    console.error('PNG metadata does not contain any character data.');
    throw new Error('No PNG metadata.');
}

/**
 * Creates a production-ready version of scenario data without internal state
 */
async function createProductionScenarioData(data, formData) {
    const { descriptionScript, firstMessageScript, scenarioScript, personalityScript, characterNote, characterNoteScript, questions, description, firstMessage, scenario, personality, } = data;
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
        const formAvatar = formEntries.find(([key]) => key === 'avatar')[1];
        if (formAvatar && typeof formAvatar === 'string') {
            // @ts-ignore
            jsonData.avatar = formAvatar;
        }
        // @ts-ignore
        jsonData.chat = formEntries.find(([key]) => key === 'chat')[1] || '';
        // @ts-ignore
        jsonData.talkativeness = formEntries.find(([key]) => key === 'talkativeness')[1] || '0.5';
        // @ts-ignore
        jsonData.fav = formEntries.find(([key]) => key === 'fav')[1] === 'true' || false;
        // @ts-ignore
        jsonData.tags = formEntries.find(([key]) => key === 'tags')[1] || [];
        // @ts-ignore
        jsonData.world = formEntries.find(([key]) => key === 'world')[1] || undefined;
        // @ts-ignore
        jsonData.data = {};
        // @ts-ignore
        jsonData.data.name = jsonData.name;
        // @ts-ignore
        jsonData.data.personality = jsonData.personality;
        // @ts-ignore
        jsonData.data.scenario = jsonData.scenario;
        // @ts-ignore
        jsonData.data.avatar = jsonData.avatar;
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
        // @ts-ignore
        jsonData.data.world = formEntries.find(([key]) => key === 'world')[1] || undefined;
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
        extensions.world = jsonData.world;
        // @ts-ignore
        jsonData.data.extensions = extensions;
    }
    let character_book;
    if (jsonData.world) {
        const file = await st_getWorldInfo(jsonData.world);
        if (file && file.entries) {
            character_book = st_server_convertWorldInfoToCharacterBook(jsonData.world, file.entries);
        }
    }
    const scenarioCreator = {
        descriptionScript: descriptionScript,
        firstMessageScript: firstMessageScript,
        scenarioScript: scenarioScript,
        personalityScript: personalityScript,
        characterNoteScript: characterNoteScript,
        questions: questions.map(({ id, inputId, text, script, type, defaultValue, required, options, showScript }) => ({
            id,
            inputId,
            text,
            script: script || '',
            type,
            defaultValue,
            required,
            showScript,
            ...(options && { options }),
        })),
        layout: data.layout || [[...questions.map((q) => q.inputId)]], // Default to all questions in one page if no layout specified
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
        creatorcomment: jsonData.creatorcomment || jsonData.data.creator_notes || '',
        avatar: jsonData.avatar || 'none',
        chat: jsonData.chat,
        talkativeness: jsonData.talkativeness || '0.5',
        fav: jsonData.fav || false,
        tags: jsonData.tags && jsonData.tags.length > 0 ? jsonData.tags.split(',').map((t) => t.trim()) : [],
        spec: jsonData.spec || 'chara_card_v3',
        spec_version: jsonData.spec_version || '3.0',
        data: {
            name: jsonData.data.name,
            description: description,
            personality: personality,
            scenario: scenario,
            first_mes: firstMessage,
            avatar: jsonData.data.avatar,
            // @ts-ignore
            mes_example: jsonData.data.mes_example || '',
            creator_notes: jsonData.data.creator_notes || jsonData.creatorcomment || '',
            system_prompt: jsonData.data.system_prompt || '',
            post_history_instructions: jsonData.data.post_history_instructions || '',
            tags: jsonData.data.tags && jsonData.data.tags.length > 0
                ? jsonData.data.tags.split(',').map((t) => t.trim())
                : [],
            creator: jsonData.data.creator || '',
            character_version: jsonData.data.character_version || '',
            alternate_greetings: jsonData.data.alternate_greetings || [],
            extensions: jsonData.data.extensions || [],
            group_only_greetings: jsonData.data.group_only_greetings || [],
            character_book: character_book,
        },
        create_date: st_humanizedDateTime(),
        scenario_creator: scenarioCreator,
    };
}
/**
 * Triggers download of scenario data as a JSON or PNG file
 */
async function downloadFile(data, filename, format = 'json') {
    if (format === 'png') {
        try {
            // Get the avatar preview image
            const avatarPreview = document.querySelector('#avatar_load_preview');
            if (!avatarPreview) {
                throw new Error('Avatar preview element not found.');
            }
            // Create a canvas to convert any image format to PNG
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Failed to get canvas context');
            }
            // Load and convert image to PNG
            const img = new Image();
            const pngBuffer = await new Promise((resolve, reject) => {
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Failed to convert image to PNG'));
                            return;
                        }
                        blob.arrayBuffer().then(resolve).catch(reject);
                    }, 'image/png');
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.crossOrigin = 'anonymous'; // Enable CORS for relative path images
                img.src = avatarPreview.src;
            });
            // Process the PNG data and trigger download
            const pngWithData = writeScenarioToPng(pngBuffer, data);
            const finalBlob = new Blob([pngWithData], { type: 'image/png' });
            triggerDownload(finalBlob, filename);
        }
        catch (error) {
            throw new Error(`Failed to process image: ${error.message}`);
        }
        return;
    }
    // JSON format
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
    });
    triggerDownload(blob, filename);
}
/**
 * Helper function to trigger file download
 */
function triggerDownload(blob, filename) {
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
    data.layout = [];
    // Get all pages from page buttons
    const pageNumbers = popup
        .find('.page-button')
        .map(function () {
        return $(this).data('page');
    })
        .get();
    // For each page, find its questions in order
    pageNumbers.forEach((pageNum) => {
        const pageQuestions = [];
        // Find all tab containers for this page
        popup.find(`.tab-button-container[data-page="${pageNum}"]`).each(function () {
            const questionId = $(this).find('.tab-button').data('tab').replace('question-', '');
            const questionGroup = popup.find(`.dynamic-input-group[data-tab="question-${questionId}"]`);
            const question = {
                id: questionId,
                // @ts-ignore
                inputId: questionGroup.find('.input-id').val(),
                // @ts-ignore
                text: questionGroup.find('.input-question').val(),
                // @ts-ignore
                script: questionGroup.find('.question-script').val() || '',
                // @ts-ignore
                type: questionGroup.find('.input-type-select').val(),
                defaultValue: '',
                required: questionGroup.find('.input-required').prop('checked'),
                // @ts-ignore
                showScript: questionGroup.find('.show-script').val() || '',
            };
            switch (question.type) {
                case 'checkbox':
                    question.defaultValue = questionGroup.find('.input-default-checkbox').prop('checked');
                    break;
                case 'select':
                    // @ts-ignore
                    question.defaultValue = questionGroup.find('.select-default').val();
                    question.options = [];
                    questionGroup.find('.option-item').each(function () {
                        // @ts-ignore
                        question.options.push({
                            // @ts-ignore
                            value: $(this).find('.option-value').val(),
                            // @ts-ignore
                            label: $(this).find('.option-label').val(),
                        });
                    });
                    break;
                default:
                    // @ts-ignore
                    question.defaultValue = questionGroup.find('.input-default').val();
            }
            data.questions.push(question);
            pageQuestions.push(question.inputId);
        });
        // Add this page's questions to layout
        data.layout.push(pageQuestions);
    });
    return data;
}
/**
 * Converts imported data to the correct format with internal state
 * @param importedData Full export data or File object for PNG imports
 * @returns null if there is an error
 */
async function convertImportedData(importedData) {
    let data;
    // Handle PNG files
    let buffer;
    if (importedData instanceof File && importedData.type === 'image/png') {
        try {
            buffer = await importedData.arrayBuffer();
            const extracted = readScenarioFromPng(buffer);
            if (!extracted) {
                await stEcho('error', 'No scenario data found in PNG file.');
                return null;
            }
            data = extracted;
        }
        catch (error) {
            await stEcho('error', `Failed to read PNG file: ${error.message}`);
            return null;
        }
    }
    else {
        data = importedData;
    }
    // Show info if no scenario_creator exists
    if (!data.scenario_creator) {
        await stEcho('info', 'No scenario_creator data found. Creating new empty data.');
    }
    // Extract scenario creator specific data or create a new empty data
    let scenarioCreator = data.scenario_creator || createEmptyScenarioExportData();
    // Check version changes
    if (scenarioCreator.version && scenarioCreator.version !== extensionVersion) {
        await stEcho('info', `Imported data version changed from ${scenarioCreator.version} to ${extensionVersion}`);
    }
    try {
        scenarioCreator = upgradeOrDowngradeData(scenarioCreator, 'export');
    }
    catch (error) {
        await stEcho('error', error.message);
        return null;
    }
    // Update avatar preview
    if ($('#rm_ch_create_block').is(':visible') && $('#form_create').attr('actiontype') === 'createcharacter') {
        let src;
        if (buffer) {
            const bytes = new Uint8Array(buffer);
            const base64String = btoa(Array.from(bytes)
                .map((byte) => String.fromCharCode(byte))
                .join(''));
            src = `data:image/png;base64,${base64String}`;
        }
        else {
            const avatar = data.avatar && data.avatar !== 'none' ? data.avatar : data.data?.avatar;
            if (avatar &&
                typeof avatar === 'string' && // I fucked up, this should be string from the beginning but it was object.
                (avatar.startsWith('data:image/png;base64,') ||
                    avatar.startsWith('data:image/jpeg;base64,') ||
                    avatar.startsWith('https'))) {
                src = avatar;
            }
        }
        if (src) {
            $('#avatar_load_preview').attr('src', src);
        }
    }
    // Import world info
    const worldNames = st_getWorldNames();
    const worldName = data.data.extensions?.world;
    if (worldName) {
        const character_book = data.data.character_book;
        $('#character_world').val(worldName);
        if (!worldNames.includes(worldName) && character_book) {
            const convertedBook = st_convertCharacterBook(character_book);
            st_saveWorldInfo(character_book.name, convertedBook, true);
            await stEcho('info', 'Lorebook is imported but you need to refresh the page to see it.');
            // await st_updateWorldInfoList();
        }
    }
    st_setWorldInfoButtonClass(undefined, !!worldName);
    const questions = (scenarioCreator.questions || []).map((q) => ({
        ...q,
        id: q.id || st_uuidv4(),
    }));
    // Handle layout information
    let layout;
    if (scenarioCreator.layout && Array.isArray(scenarioCreator.layout)) {
        layout = scenarioCreator.layout;
    }
    else {
        // Default to all questions in one page
        layout = [[...questions.map((q) => q.inputId)]];
    }
    return {
        description: data.description || data.data?.description || '',
        descriptionScript: scenarioCreator.descriptionScript || '',
        firstMessage: data.first_mes || data.data?.first_mes || '',
        firstMessageScript: scenarioCreator.firstMessageScript || '',
        scenario: data.scenario || data.data?.scenario || '',
        scenarioScript: scenarioCreator.scenarioScript || '',
        personality: data.personality || data.data?.personality || '',
        personalityScript: scenarioCreator.personalityScript || '',
        characterNote: data.data?.extensions?.depth_prompt?.prompt || '',
        characterNoteScript: scenarioCreator.characterNoteScript || '',
        questions,
        layout,
        activeTab: 'description',
        version: scenarioCreator.version,
    };
}

/**
 * Sets up script input update handlers for all tabs
 */
function updateScriptInputs(popup, type) {
    const config = {
        description: {
            containerId: '#script-inputs-container',
        },
        'first-message': {
            containerId: '#first-message-script-inputs-container',
        },
        scenario: {
            containerId: '#scenario-script-inputs-container',
        },
        personality: {
            containerId: '#personality-script-inputs-container',
        },
        'character-note': {
            containerId: '#character-note-script-inputs-container',
        },
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

const CORE_TABS = ['description', 'first-message', 'scenario', 'personality', 'character-note'];
/**
 * Sets up tab switching functionality with auto-save
 */
function setupTabFunctionality(popup) {
    // Core tab handling
    popup.on('click', '.tab-button', function () {
        const tabId = $(this).data('tab');
        if (!tabId)
            return;
        // Save current state before switching tabs
        const currentData = getScenarioCreateDataFromUI(popup);
        saveScenarioCreateData(currentData);
        switchTab(tabId);
    });
    // Page button handling
    popup.on('click', '.page-button', function () {
        const pageNum = $(this).data('page');
        if (!pageNum)
            return;
        togglePage(pageNum);
    });
    // Add page button handling
    popup.on('click', '#add-page-btn', function () {
        const pageButtons = popup.find('.page-button');
        const newPageNum = pageButtons.length + 1;
        const newPageButton = createPageButton(newPageNum);
        // Add the new page button
        popup.find('#page-tab-buttons').append(newPageButton);
        // Switch to the new page
        togglePage(newPageNum);
        // Save the current state
        const currentData = getScenarioCreateDataFromUI(popup);
        if (!currentData.layout[newPageNum - 1]) {
            currentData.layout[newPageNum - 1] = [];
        }
        saveScenarioCreateData(currentData);
    });
    // Remove page button handling
    popup.on('click', '#remove-page-btn', function () {
        const currentPage = getCurrentPage();
        if (!currentPage)
            return;
        // Check if the current page has any questions
        const questionTabs = popup.find(`.tab-button-container[data-page="${currentPage}"]`);
        if (questionTabs.length > 0) {
            alert('Cannot remove a page that contains questions. Please move or delete the questions first.');
            return;
        }
        // Get the current state
        const currentData = getScenarioCreateDataFromUI(popup);
        // Remove the page from layout
        currentData.layout.splice(currentPage - 1, 1);
        saveScenarioCreateData(currentData);
        // Remove the page button
        popup.find(`.page-button[data-page="${currentPage}"]`).parent().remove();
        // Renumber remaining pages
        renumberPages(popup, currentPage);
        // Switch to the previous page or page 1
        const newPage = Math.max(1, currentPage - 1);
        togglePage(newPage);
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
 * Gets the current active page number
 */
function getCurrentPage() {
    const activePageButton = $('.page-button.active');
    return activePageButton.length ? parseInt(activePageButton.data('page')) : 1;
}
/**
 * Renumbers pages after a page is removed
 * @param popup The popup jQuery element
 * @param removedPageNumber The number of the page that was removed
 */
function renumberPages(popup, removedPageNumber) {
    // First, update questions from the higher pages to have correct page numbers
    for (let i = removedPageNumber + 1; i <= popup.find('.page-button').length + 1; i++) {
        // Move questions from higher pages down one number
        const questionsToUpdate = popup.find(`.tab-button-container[data-page="${i}"]`);
        questionsToUpdate.attr('data-page', i - 1);
    }
    // Then update the page buttons
    popup.find('.page-button').each(function (index) {
        const newPageNum = index + 1;
        const pageButton = $(this);
        // Update button text and data attribute
        pageButton.text(`Page ${newPageNum}`).attr('data-page', newPageNum).data('page', newPageNum);
    });
}
/**
 * Toggles visibility of questions for a specific page
 */
function togglePage(pageNum) {
    const popup = $('#scenario-create-dialog');
    const container = popup.find('#questions-container');
    const pageButton = popup.find(`.page-button[data-page="${pageNum}"]`);
    const questionTabs = popup.find(`.tab-button-container[data-page="${pageNum}"]`);
    // Toggle active state for page button
    popup.find('.page-button').removeClass('active');
    pageButton.addClass('active');
    // Toggle visibility of questions
    container.find('.tab-button-container').hide();
    questionTabs.show();
    // If there's no active question tab visible, activate the first one
    const activeTab = container.find('.tab-button.active');
    if (!activeTab.length || !activeTab.closest('.tab-button-container').is(':visible')) {
        const firstVisibleTab = questionTabs.first().find('.tab-button');
        if (firstVisibleTab.length) {
            switchTab(firstVisibleTab.data('tab'));
        }
    }
    // Save current state before switching tabs
    const currentData = getScenarioCreateDataFromUI(popup);
    saveScenarioCreateData(currentData);
}
/**
 * Switches to the specified tab. It is only for core and question tabs. Not page.
 */
function switchTab(tabId) {
    const popup = $('#scenario-create-dialog');
    const $popup = popup;
    $popup.find('.tab-button').removeClass('active');
    $popup.find('.tab-content').removeClass('active');
    $popup.find(`.tab-button[data-tab="${tabId}"]`).addClass('active');
    $popup.find(`.tab-content[data-tab="${tabId}"]`).addClass('active');
    // Update script inputs based on active tab
    if (CORE_TABS.includes(tabId)) {
        updateScriptInputs($popup, tabId);
    }
    else {
        updateQuestionScriptInputs($popup.find(`.dynamic-input-group[data-tab="${tabId}"]`));
    }
}
/**
 * Creates a new page button
 */
function createPageButton(pageNum) {
    const template = document.querySelector('#page-button-template');
    if (!template)
        throw new Error('Page button template not found');
    const content = template.content.cloneNode(true);
    const container = content.querySelector('.page-button-container');
    if (!container)
        throw new Error('Page button container not found in template');
    const buttonHtml = container.outerHTML.replace(/\{page\}/g, pageNum.toString());
    return $(buttonHtml);
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
    const tabHtml = tabButtonTemplate
        .html()
        .replace(/{id}/g, question.id)
        .replace(/{number}/g, question.inputId || 'unnamed')
        .replace(/{page}/g, getCurrentPage().toString());
    const newInput = $(inputTemplate.html().replace(/{id}/g, question.id));
    // Set values
    newInput.find('.input-id').val(question.inputId);
    newInput.find('.input-type-select').val(question.type).trigger('change');
    newInput.find('.input-question').val(question.text || '');
    newInput.find('.question-script').val(question.script || '');
    newInput.find('.show-script').val(question.showScript || '');
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
            newInput.find('.default-value-input-container textarea').hide();
            const checkboxDefault = newInput.find('.default-value-input-container .checkbox-default');
            checkboxDefault.find('input').prop('checked', question.defaultValue);
            checkboxDefault.show();
            break;
        case 'select':
            const optionsList = newInput.find('.options-list');
            const selectDefault = newInput.find('.select-default');
            // Clear existing default options
            selectDefault.find('option:not(:first)').remove();
            // Add options and set up handlers
            question.options?.forEach((option) => {
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
    const addInputBtn = popup.find('#add-question-btn');
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
            showScript: '',
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
    newInput
        .find('.input-type-select, .input-default, .input-default-checkbox, .select-default')
        .on('change', function () {
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
    // Clear existing page buttons
    popup.find('#page-tab-buttons').empty();
    popup.find('#dynamic-tab-buttons').empty();
    // Find unique pages from layout
    const pages = new Set();
    data.layout.forEach((_, index) => pages.add(index + 1));
    if (data.questions.length > 0 && pages.size === 0)
        pages.add(1);
    // Create page buttons
    pages.forEach((pageNum) => {
        const pageButton = createPageButton(pageNum);
        popup.find('#page-tab-buttons').append(pageButton);
    });
    // Sort questions based on layout array
    const sortedQuestions = [...data.questions].sort((a, b) => {
        const aPage = data.layout.findIndex((page) => page.includes(a.inputId)) + 1 || 1;
        const bPage = data.layout.findIndex((page) => page.includes(b.inputId)) + 1 || 1;
        if (aPage !== bPage)
            return aPage - bPage;
        // Sort by position within the page array
        const pageAIndex = data.layout[aPage - 1]?.indexOf(a.inputId) ?? -1;
        const pageBIndex = data.layout[bPage - 1]?.indexOf(b.inputId) ?? -1;
        return pageAIndex - pageBIndex;
    });
    // Restore questions in sorted order
    sortedQuestions.forEach((question) => {
        addQuestionToUI(popup, question);
        const pageNumber = data.layout.findIndex((page) => page.includes(question.inputId)) + 1 || 1;
        // Update tab button container with page attribute
        const tabButton = popup.find(`.tab-button-container:has([data-tab="question-${question.id}"])`);
        tabButton.attr('data-page', pageNumber);
    });
    // Show questions container if there are questions
    if (sortedQuestions.length > 0) {
        popup.find('#questions-container').addClass('active');
        // Show first page by default
        if (pages.size > 0) {
            togglePage(Math.min(...Array.from(pages)));
        }
    }
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
function applyScenarioExportDataToSidebar(importedData) {
    if ($('#form_create').attr('actiontype') !== 'createcharacter') {
        return;
    }
    if (importedData.data.extensions?.depth_prompt !== undefined) {
        $('#depth_prompt_depth').val(importedData.data.extensions.depth_prompt.depth);
        $('#depth_prompt_role').val(importedData.data.extensions.depth_prompt.role || 'system');
    }
    else {
        $('#depth_prompt_depth').val(4);
        $('#depth_prompt_role').val('system');
    }
    $('#creator_textarea').val(importedData.data.creator || '');
    $('#creator_notes_textarea').val(importedData.creatorcomment || importedData.data.creator_notes || '');
    $('#tags_textarea').val((importedData.tags || importedData.data.tags || []).join(', '));
    $('#character_version_textarea').val(importedData.data.character_version || '');
    $('#character_world').val(importedData.data.extensions?.world || '');
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
    callGenericPopup(scenarioCreateDialogHtml, POPUP_TYPE.DISPLAY, '', {
        large: true,
        wide: true,
    });
    setupPopupHandlers();
    // Load saved data after popup is created
    const popup = $('#scenario-create-dialog');
    let savedData = loadScenarioCreateData();
    // Check version changes
    if (savedData.version && savedData.version !== extensionVersion) {
        await stEcho('info', `Version of cache data changed from ${savedData.version} to ${extensionVersion}`);
    }
    try {
        savedData = upgradeOrDowngradeData(savedData, 'create');
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
    setupQuestionReordering(popup);
    setupExportButton(popup);
    setupImportButton(popup);
    setupResetButton(popup);
}
/**
 * Sets up question reordering functionality
 */
function setupQuestionReordering(popup) {
    // Enable drag and drop for tab buttons
    popup.find('#dynamic-tab-buttons').on('mouseenter', '.tab-button-container', function () {
        $(this).attr('draggable', 'true');
    });
    let draggedItem = null;
    // Handle both drag-drop and button clicks for reordering
    popup.on('dragstart', '.tab-button-container', function (e) {
        draggedItem = this;
        $(this).index();
        e.originalEvent?.dataTransfer?.setData('text/plain', '');
        $(this).addClass('dragging');
    });
    popup.on('dragend', '.tab-button-container', function () {
        $(this).removeClass('dragging');
        draggedItem = null;
    });
    // Create placeholder element matching template structure
    const placeholder = $('<div class="tab-button-container placeholder">' +
        '<button class="tab-button menu_button question">Drop Here</button>' +
        '<button class="remove-input-btn menu_button danger" title="Remove Question">🗑️</button>' +
        '</div>');
    placeholder.hide();
    popup.on('dragover', '.tab-button-container', function (e) {
        e.preventDefault();
        if (!draggedItem || draggedItem === this)
            return;
        const rect = this.getBoundingClientRect();
        const dropPosition = e.originalEvent.clientY - rect.top > rect.height / 2 ? 'after' : 'before';
        // Remove drop indicators from all items
        popup.find('.tab-button-container').removeClass('drop-before drop-after');
        // Show drop indicator on current target
        $(this).addClass(`drop-${dropPosition}`);
        // Position placeholder
        if (dropPosition === 'before') {
            $(this).before(placeholder);
        }
        else {
            $(this).after(placeholder);
        }
        placeholder.show();
        // Update input preview position while dragging
        const draggedTabId = $(draggedItem).find('.tab-button').data('tab');
        const targetTabId = $(this).find('.tab-button').data('tab');
        const dynamicInputsContainer = popup.find('#dynamic-inputs-container');
        const draggedInputGroup = dynamicInputsContainer.find(`[data-tab="${draggedTabId}"]`);
        const targetInputGroup = dynamicInputsContainer.find(`[data-tab="${targetTabId}"]`);
        if (dropPosition === 'before') {
            targetInputGroup.before(draggedInputGroup);
        }
        else {
            targetInputGroup.after(draggedInputGroup);
        }
    });
    popup.on('dragleave', '.tab-button-container', function (e) {
        const event = e.originalEvent;
        // Only remove indicators if we're not entering a child element
        if (!event.relatedTarget || !(event.relatedTarget instanceof Element) || !$.contains(this, event.relatedTarget)) {
            $(this).removeClass('drop-before drop-after');
            placeholder.hide();
        }
    });
    // Handle dragend to clean up and reattach event handlers
    popup.on('dragend', function () {
        popup.find('.tab-button-container').removeClass('drop-before drop-after dragging');
        placeholder.hide();
        // Reattach remove button handlers
        popup.find('#dynamic-tab-buttons .tab-button-container').each(function () {
            const container = $(this);
            // Remove existing handler to prevent duplicates
            container.find('.remove-input-btn').off('click');
            // Reattach handler
            setupRemoveButton(container, popup);
        });
    });
    popup.on('drop', '.tab-button-container', function (e) {
        e.preventDefault();
        if (!draggedItem || draggedItem === this)
            return;
        // Get page number and current data
        const tabContainer = $(draggedItem);
        const pageNumber = parseInt(tabContainer.attr('data-page')) || 1;
        const data = getScenarioCreateDataFromUI(popup);
        data.layout[pageNumber - 1] || [];
        const dropTarget = this;
        const rect = dropTarget.getBoundingClientRect();
        const dropAfter = e.originalEvent.clientY - rect.top > rect.height / 2;
        // Remove drop visual indicators
        $(this).removeClass('drop-before drop-after');
        // Update DOM order
        const dynamicInputsContainer = popup.find('#dynamic-inputs-container');
        const dynamicTabButtons = popup.find('#dynamic-tab-buttons');
        if (dropAfter) {
            $(dropTarget).after(draggedItem);
        }
        else {
            $(dropTarget).before(draggedItem);
        }
        // Update input groups order to match tab order
        const newOrder = dynamicTabButtons
            .children()
            .map(function () {
            return $(this).find('.tab-button').data('tab');
        })
            .get();
        newOrder.forEach((tabId, index) => {
            const inputGroup = dynamicInputsContainer.find(`[data-tab="${tabId}"]`);
            if (index === 0) {
                dynamicInputsContainer.prepend(inputGroup);
            }
            else {
                const prevInput = dynamicInputsContainer.find(`[data-tab="${newOrder[index - 1]}"]`);
                prevInput.after(inputGroup);
            }
        });
        // Update data layout
        const newLayout = newOrder.map((tabId) => {
            const inputGroup = dynamicInputsContainer.find(`[data-tab="${tabId}"]`);
            const value = inputGroup.find('.input-id').val();
            return value?.toString() || '';
        });
        data.layout[pageNumber - 1] = newLayout;
        saveScenarioCreateData(data);
        // Reattach handlers after all DOM updates are complete
        popup.find('#dynamic-tab-buttons .tab-button-container').each(function () {
            const container = $(this);
            // Remove existing handler to prevent duplicates
            container.find('.remove-input-btn').off('click');
            // Reattach handler
            setupRemoveButton(container, popup);
        });
    });
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
    const fileInput = $('<input type="file" accept=".json, .png" style="display: none">');
    popup.append(fileInput);
    // Handle import button click
    popup.find('#import-scenario-btn').on('click', function () {
        fileInput.trigger('click');
    });
    // Handle file selection
    fileInput.on('change', async function (e) {
        const file = e.target.files[0];
        if (!file)
            return;
        if (file.type === 'image/png') {
            try {
                const buffer = await file.arrayBuffer();
                const importedData = readScenarioFromPng(buffer);
                const scenarioData = await convertImportedData(file);
                if (!scenarioData) {
                    return;
                }
                // Clear existing data
                popup.find('#dynamic-tab-buttons').empty();
                popup.find('#dynamic-inputs-container').empty();
                // Apply imported data
                applyScenarioCreateDataToUI(popup, scenarioData);
                // Apply imported data to character sidebar (only neccessary fields)
                applyScenarioExportDataToSidebar(importedData);
                // Save imported data
                saveScenarioCreateData(scenarioData);
            }
            catch (error) {
                console.error('Import error:', error);
                await stEcho('error', 'Failed to import scenario data from PNG. Please check the file and try again.');
            }
        }
        else {
            // Handle JSON files
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
                    // Apply imported data to character sidebar (only neccessary fields)
                    applyScenarioExportDataToSidebar(importedData);
                    // Save imported data
                    saveScenarioCreateData(scenarioData);
                }
                catch (error) {
                    console.error('Import error:', error);
                    await stEcho('error', 'Failed to import scenario data. Please check the file and try again.');
                }
            };
            reader.readAsText(file);
        }
        // Reset file input for future imports
        fileInput.val('');
    });
}
/**
 * Sets up the export button functionality
 */
function setupExportButton(popup) {
    let isExportPopupOpen = false;
    const exportButton = popup.find('#export-scenario-btn').get(0);
    const formatPopup = popup.find('#export-format-popup').get(0);
    // Create popper instance
    let exportPopper = st_createPopper(exportButton, formatPopup, {
        placement: 'left-end',
    });
    popup.find('#export-scenario-btn').on('click', function () {
        isExportPopupOpen = !isExportPopupOpen;
        popup.find('#export-format-popup').toggle(isExportPopupOpen);
        exportPopper.update();
    });
    popup.find('.export-format').on('click', async function () {
        const format = $(this).data('format');
        if (!format) {
            return;
        }
        // Hide popup
        popup.find('#export-format-popup').hide();
        isExportPopupOpen = false;
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
        const productionData = await createProductionScenarioData(currentData, formData);
        downloadFile(productionData, `scenario.${format}`, format);
    });
    // Close popup when clicking outside
    $(document).on('click', function (event) {
        if (isExportPopupOpen && !$(event.target).closest('.export-container').length) {
            popup.find('#export-format-popup').hide();
            isExportPopupOpen = false;
            exportPopper.update();
        }
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
    const fileInput = $('<input type="file" accept=".json, .png" style="display: none">');
    $('body').append(fileInput);
    // Handle file selection
    fileInput.on('change', async function (e) {
        const file = e.target.files[0];
        if (!file)
            return;
        try {
            let scenarioData;
            let buffer;
            let fileType;
            if (file.type === 'image/png') {
                // Handle PNG files
                buffer = await file.arrayBuffer();
                fileType = 'png';
                const extracted = readScenarioFromPng(buffer);
                if (!extracted) {
                    await stEcho('error', 'No scenario data found in PNG file.');
                    return;
                }
                scenarioData = extracted;
            }
            else {
                // Handle JSON files
                const text = await file.text();
                buffer = new TextEncoder().encode(text);
                fileType = 'json';
                scenarioData = JSON.parse(text);
            }
            if (!scenarioData.scenario_creator) {
                await stEcho('warning', 'This scenario does not have a creator section');
                return;
            }
            // Check version changes
            if (scenarioData.scenario_creator.version && scenarioData.scenario_creator.version !== extensionVersion) {
                console.debug(`[${extensionName}] Scenario version changed from ${scenarioData.scenario_creator.version} to ${extensionVersion}`);
            }
            scenarioData.scenario_creator = upgradeOrDowngradeData(scenarioData.scenario_creator, 'export');
            setupPlayDialogHandlers(scenarioData, buffer, fileType);
        }
        catch (error) {
            console.error('Import error:', error);
            await stEcho('error', 'Error importing scenario: ' + error.message);
        }
        // Clean up
        fileInput.remove();
    });
    // Trigger file picker
    fileInput.trigger('click');
}
/**
 * Sets up handlers for the play dialog
 */
async function setupPlayDialogHandlers(scenarioData, buffer, fileType) {
    const scenarioPlayDialogHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-play-dialog'));
    const { descriptionScript, firstMessageScript, scenarioScript, personalityScript, questions, characterNoteScript } = scenarioData.scenario_creator || {};
    let popup;
    let dynamicInputsContainer;
    let inputTemplate;
    // Set up pagination variables
    let currentPageIndex = 0;
    // @ts-ignore - Already checked in upper function
    const layout = scenarioData.scenario_creator.layout || [[...questions.map((q) => q.inputId)]];
    callGenericPopup(scenarioPlayDialogHtml, POPUP_TYPE.TEXT, '', {
        okButton: true,
        cancelButton: true,
        wider: true,
        onClosing: async (popupInstance) => {
            if (popupInstance.result !== POPUP_RESULT.AFFIRMATIVE) {
                return true;
            }
            // Check if we are in the last page
            if (currentPageIndex < layout.length - 1) {
                await stEcho('warning', 'Please go to the last page before playing');
                return false;
            }
            // On final submission, validate all fields
            const allAnswers = {};
            let hasValidationErrors = false;
            popup.find('.dynamic-input').each(function () {
                const $input = $(this);
                const id = $input.data('id');
                const required = $input.data('required');
                const shouldShow = $input.data('show');
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
                if (shouldShow && required && (value === '' || value === undefined)) {
                    hasValidationErrors = true;
                    $input.closest('.dynamic-input-group').find('.validation-error').text('This field is required').show();
                }
            });
            if (hasValidationErrors) {
                // Find first page with validation error
                for (let i = 0; i < layout.length; i++) {
                    const inputIds = layout[i];
                    const hasError = inputIds.some((inputId) => {
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
                const descriptionVars = descriptionScript
                    ? executeMainScript(descriptionScript, allAnswers, 'remove')
                    : allAnswers;
                const description = interpolateText(scenarioData.description || scenarioData.data?.description, descriptionVars, 'remove');
                const firstMessageVars = firstMessageScript
                    ? executeMainScript(firstMessageScript, allAnswers, 'remove')
                    : allAnswers;
                const firstMessage = interpolateText(scenarioData.first_mes || scenarioData.data?.first_mes, firstMessageVars, 'remove');
                const scenarioVars = scenarioScript ? executeMainScript(scenarioScript, allAnswers, 'remove') : allAnswers;
                const processedScenario = interpolateText(scenarioData.scenario || scenarioData.data?.scenario, scenarioVars, 'remove');
                const personalityVars = personalityScript
                    ? executeMainScript(personalityScript, allAnswers, 'remove')
                    : allAnswers;
                const processedPersonality = interpolateText(scenarioData.personality || scenarioData.data?.personality, personalityVars, 'remove');
                // Update both main and data.scenario fields
                scenarioData.scenario = processedScenario;
                scenarioData.data.scenario = processedScenario;
                // Update both main and data.personality fields
                scenarioData.personality = processedPersonality;
                scenarioData.data.personality = processedPersonality;
                // Add character note script processing and update extensions.depth_prompt.prompt
                if (scenarioData.data.extensions && scenarioData.data.extensions.depth_prompt) {
                    const characterNoteVars = characterNoteScript
                        ? executeMainScript(characterNoteScript, allAnswers, 'remove')
                        : allAnswers;
                    const processedCharacterNote = interpolateText(scenarioData.data.extensions.depth_prompt.prompt, characterNoteVars, 'remove');
                    scenarioData.data.extensions.depth_prompt.prompt = processedCharacterNote;
                }
                // Create form data for character creation
                const formData = new FormData();
                scenarioData.description = description;
                scenarioData.first_mes = firstMessage;
                scenarioData.data.description = description;
                scenarioData.data.first_mes = firstMessage;
                if (fileType === 'png' && buffer) {
                    // For PNG, create a new buffer with new scenario data
                    const newBuffer = writeScenarioToPng(buffer, scenarioData);
                    const newFile = new Blob([newBuffer], {
                        type: 'image/png',
                    });
                    formData.append('avatar', newFile, 'scenario.png');
                    formData.append('file_type', 'png');
                }
                else {
                    // For JSON, use the standard JSON format
                    const newFile = new Blob([JSON.stringify(scenarioData)], {
                        type: 'application/json',
                    });
                    formData.append('avatar', newFile, 'scenario.json');
                    formData.append('file_type', 'json');
                }
                const headers = st_getRequestHeaders();
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
                const fetchBody = (await fetchResult.json());
                await st_updateCharacters();
                if (!fetchBody.file_name) {
                    await stEcho('error', 'Failed to get file name from server.');
                    return false;
                }
                await stGo(`${fetchBody.file_name}.png`);
                async function updateAvatar() {
                    if (fetchBody.file_name) {
                        let thumbnailUrl = st_getThumbnailUrl('avatar', `${fetchBody.file_name}.png`);
                        await fetch(thumbnailUrl, {
                            method: 'GET',
                            cache: 'no-cache',
                            headers: {
                                pragma: 'no-cache',
                                'cache-control': 'no-cache',
                            },
                        });
                        // Add time query to avoid caching
                        thumbnailUrl += `&scenarioTime=${new Date().getTime()}`;
                        $('#avatar_load_preview').attr('src', thumbnailUrl);
                        $('.mes').each(function () {
                            const nameMatch = $(this).attr('ch_name') === scenarioData.name;
                            if ($(this).attr('is_system') == 'true' && !nameMatch) {
                                return;
                            }
                            if ($(this).attr('is_user') == 'true') {
                                return;
                            }
                            if (nameMatch) {
                                const avatar = $(this).find('.avatar img');
                                avatar.attr('src', thumbnailUrl);
                            }
                        });
                    }
                }
                updateAvatar();
                // Import world info
                const chid = $('#set_character_world').data('chid');
                if (chid) {
                    const characters = st_getCharacters();
                    const worldName = characters[chid]?.data?.extensions?.world;
                    if (worldName) {
                        const hasEmbed = st_checkEmbeddedWorld(chid);
                        const worldNames = st_getWorldNames();
                        if (hasEmbed && !worldNames.includes(worldName)) {
                            await st_importEmbeddedWorldInfo();
                            st_saveCharacterDebounced();
                        }
                        else {
                            st_setWorldInfoButtonClass(chid, true);
                        }
                    }
                }
                return true;
            }
            catch (error) {
                console.error('Error processing scenario:', error);
                await stEcho('error', 'Error processing scenario: ' + error.message);
                return false;
            }
        },
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
        const currentPageInputs = popup
            .find('.dynamic-input')
            .filter((_, el) => layout[currentPageIndex].includes($(el).data('id')));
        currentPageInputs.each(function () {
            const $input = $(this);
            if ($input.data('required') && $input.data('show')) {
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
                    $input.closest('.dynamic-input-group').find('.validation-error').text('This field is required').show();
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
            const variables = question.script ? executeMainScript(question.script, answers, 'remove') : answers;
            const interpolated = interpolateText(question.text, variables, 'remove');
            questionWrapper.find('.input-question').text(interpolated + (question.required ? ' *' : ''));
        }
        catch (error) {
            console.error('Question text update error:', error);
            questionWrapper
                .find('.input-question')
                .text(question.text + (question.required ? ' *' : '') + ` (Script error: ${error.message})`);
        }
    }
    // Create all inputs at initialization
    function createAllInputs() {
        // @ts-ignore - Already checked in upper function
        questions.forEach((question) => {
            const newInput = $(inputTemplate.html());
            newInput.addClass('dynamic-input-wrapper');
            newInput.attr('data-input-id', question.inputId);
            const inputContainer = newInput.find('.input-container');
            const inputAttrs = {
                'data-id': question.inputId,
                'data-required': question.required || false,
                'data-show': true, // Default to showing questions, will update when showScript is executed
            };
            switch (question.type) {
                case 'checkbox':
                    inputContainer.html(`
                    <label class="checkbox_label">
                        <input type="checkbox" class="dynamic-input"
                            ${Object.entries(inputAttrs)
                        .map(([key, val]) => `${key}="${val}"`)
                        .join(' ')}
                            ${question.defaultValue ? 'checked' : ''}>
                    </label>
                `);
                    break;
                case 'select':
                    const selectHtml = `
                    <select class="text_pole dynamic-input"
                        ${Object.entries(inputAttrs)
                        .map(([key, val]) => `${key}="${val}"`)
                        .join(' ')}>
                        ${question
                        .options.map((opt) => `<option value="${opt.value}" ${opt.value === question.defaultValue ? 'selected' : ''}>${opt.label}</option>`)
                        .join('')}
                    </select>
                `;
                    inputContainer.html(selectHtml);
                    break;
                default: // text
                    inputContainer.html(`
                    <input type="text" class="text_pole dynamic-input"
                        ${Object.entries(inputAttrs)
                        .map(([key, val]) => `${key}="${val}"`)
                        .join(' ')}
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
                // @ts-ignore - Already checked in upper function
                questions.forEach((q) => {
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
        // @ts-ignore - Already checked in upper function
        const currentPageQuestions = questions.filter((q) => layout[currentPageIndex].includes(q.inputId));
        // Collect current answers for script execution
        const answers = {};
        popup.find('.dynamic-input').each(function () {
            const $input = $(this);
            const id = $input.data('id');
            if ($input.is('select')) {
                const label = $input.find('option:selected').text();
                answers[id] = { label, value: $input.val() };
            }
            else {
                answers[id] = $input.attr('type') === 'checkbox' ? $input.prop('checked') : $input.val();
            }
        });
        currentPageQuestions.forEach((question) => {
            const wrapper = dynamicInputsContainer.find(`[data-input-id="${question.inputId}"]`);
            const shouldShow = !question.showScript || executeShowScript(question.showScript, answers, 'remove');
            // Update the show status and display accordingly
            wrapper.find('.dynamic-input').data('show', shouldShow);
            if (shouldShow) {
                wrapper.show();
                updateQuestionText(wrapper, question);
            }
        });
        // Update navigation
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
