import {
  FullExportData,
  Question,
  STORAGE_KEY,
  ScenarioCreateData,
  ScenarioExportData,
  createEmptyScenarioCreateData,
  createEmptyScenarioExportData,
  upgradeOrDowngradeData,
} from '../types';
import {
  st_uuidv4,
  st_humanizedDateTime,
  st_getcreateCharacterData,
  extensionVersion,
  stEcho,
  st_getWorldInfo,
  st_server_convertWorldInfoToCharacterBook,
  st_getWorldNames,
  st_convertCharacterBook,
  st_saveWorldInfo,
  st_setWorldInfoButtonClass,
} from '../config';
import { readScenarioFromPng, writeScenarioToPng } from '../utils/png-handlers';

/**
 * Creates a production-ready version of scenario data without internal state
 */
export async function createProductionScenarioData(
  data: ScenarioCreateData,
  formData: FormData,
): Promise<FullExportData> {
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

  let character_book: { entries: any[]; name: string } | undefined;
  if (jsonData.world) {
    const file = await st_getWorldInfo(jsonData.world);
    if (file && file.entries) {
      character_book = st_server_convertWorldInfoToCharacterBook(jsonData.world, file.entries);
    }
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
    creatorcomment: jsonData.creatorcomment || jsonData.data.creator_notes || '',
    avatar: jsonData.avatar || 'none',
    chat: jsonData.chat,
    talkativeness: jsonData.talkativeness || '0.5',
    fav: jsonData.fav || false,
    tags: jsonData.tags && jsonData.tags.length > 0 ? jsonData.tags.split(',').map((t: string) => t.trim()) : [],
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
      tags:
        jsonData.data.tags && jsonData.data.tags.length > 0
          ? jsonData.data.tags.split(',').map((t: string) => t.trim())
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
export async function downloadFile(data: FullExportData, filename: string, format: 'json' | 'png' = 'json') {
  if (format === 'png') {
    try {
      // Get the avatar preview image
      const avatarPreview = document.querySelector<HTMLImageElement>('#avatar_load_preview');
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
      const pngBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
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
    } catch (error: any) {
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
function triggerDownload(blob: Blob, filename: string) {
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
 * @param importedData Full export data or File object for PNG imports
 * @returns null if there is an error
 */
export async function convertImportedData(importedData: FullExportData | File): Promise<ScenarioCreateData | null> {
  let data: FullExportData;

  // Handle PNG files
  let buffer: ArrayBuffer | undefined;
  if (importedData instanceof File && importedData.type === 'image/png') {
    try {
      buffer = await importedData.arrayBuffer();

      const extracted = readScenarioFromPng(buffer);
      if (!extracted) {
        await stEcho('error', 'No scenario data found in PNG file.');
        return null;
      }
      data = extracted;
    } catch (error: any) {
      await stEcho('error', `Failed to read PNG file: ${error.message}`);
      return null;
    }
  } else {
    data = importedData as FullExportData;
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
  } catch (error: any) {
    await stEcho('error', error.message);
    return null;
  }

  // Update avatar preview
  if ($('#rm_ch_create_block').is(':visible') && $('#form_create').attr('actiontype') === 'createcharacter') {
    let src: string | undefined;
    if (buffer) {
      const bytes = new Uint8Array(buffer);
      const base64String = btoa(
        Array.from(bytes)
          .map((byte) => String.fromCharCode(byte))
          .join(''),
      );
      src = `data:image/png;base64,${base64String}`;
    } else {
      const avatar = data.avatar && data.avatar !== 'none' ? data.avatar : data.data?.avatar;
      if (
        avatar &&
        typeof avatar === 'string' && // I fucked up, this should be string from the beginning but it was object.
        (avatar.startsWith('data:image/png;base64,') ||
          avatar.startsWith('data:image/jpeg;base64,') ||
          avatar.startsWith('https'))
      ) {
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

  const questions = (scenarioCreator.questions || []).map((q: any) => ({
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
