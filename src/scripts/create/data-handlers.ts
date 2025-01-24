import {
  FullExportData,
  Question,
  STORAGE_KEY,
  ScenarioCreateData,
  ScenarioExportData,
  createEmptyScenarioCreateData,
  upgradeOrDowngradeData,
} from '../types';
import { st_uuidv4, st_humanizedDateTime, st_getcreateCharacterData, extensionVersion, stEcho } from '../config';

/**
 * Creates a production-ready version of scenario data without internal state
 */
export function createProductionScenarioData(data: ScenarioCreateData, formData: FormData): FullExportData {
  const {
    descriptionScript,
    firstMessageScript,
    scenarioScript,
    personalityScript,
    characterNote,
    characterNoteScript,
    questions,
    description,
    firstMessage,
    scenario,
    personality,
  } = data;
  const formEntries = Array.from(formData.entries());
  let jsonData;

  // Extract json_data
  for (const [key, value] of formEntries) {
    if (key === 'json_data' && value) {
      jsonData = JSON.parse(value as any);
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
    jsonData.fav = formEntries.find(([key]) => key === 'fav')[1] === 'true' || false;
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

  const scenarioCreator: ScenarioExportData = {
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
      group_only_greetings: jsonData.data.group_only_greetings || [],
    },
    create_date: st_humanizedDateTime(),
    scenario_creator: scenarioCreator,
  };
}

/**
 * Triggers download of scenario data as a JSON file
 */
export function downloadFile(data: FullExportData, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
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
export function loadScenarioCreateData(): ScenarioCreateData {
  const storedData = localStorage.getItem(STORAGE_KEY);
  return storedData ? JSON.parse(storedData) : createEmptyScenarioCreateData();
}

/**
 * Removes the scenario data from the local storage by deleting the item associated with STORAGE_KEY.
 */
export function removeScenarioCreateData() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Saves scenario data to local storage
 */
export function saveScenarioCreateData(data: ScenarioCreateData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Extracts current scenario data from the UI
 */
export function getScenarioCreateDataFromUI(popup: JQuery<HTMLElement>): ScenarioCreateData {
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
    const question: Question = {
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
      required: $(this).find('.input-required').prop('checked'),
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
        $(this)
          .find('.option-item')
          .each(function () {
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
    .map((pageNum) => questionsByPage.get(pageNum));

  return data;
}

/**
 * Converts imported data to the correct format with internal state
 * @returns null if there is an error
 */
export async function convertImportedData(importedData: FullExportData): Promise<ScenarioCreateData | null> {
  // Extract scenario creator specific data
  let scenarioCreator = importedData.scenario_creator || {};
  // Check version changes
  if (scenarioCreator.version && scenarioCreator.version !== extensionVersion) {
    await stEcho('info', `Imported data version changed from ${scenarioCreator.version} to ${extensionVersion}`);
  }
  try {
    scenarioCreator = upgradeOrDowngradeData(scenarioCreator, 'export');
  } catch (error: any) {
    await stEcho('error', error.message);
    return null;
  }

  const questions = (scenarioCreator.questions || []).map((q) => ({
    ...q,
    id: q.id || st_uuidv4(),
  }));

  // Handle layout information
  let layout;
  if (scenarioCreator.layout && Array.isArray(scenarioCreator.layout)) {
    layout = scenarioCreator.layout;
  } else {
    // Default to all questions in one page
    layout = [[...questions.map((q) => q.inputId)]];
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
    version: scenarioCreator.version,
  };
}
