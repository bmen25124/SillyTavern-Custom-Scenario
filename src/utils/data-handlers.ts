import {
  FullExportData,
  Question,
  STORAGE_KEY,
  ScenarioCreateData,
  ScenarioExportData,
  createEmptyScenarioCreateData,
  createEmptyScenarioExportData,
  upgradeOrDowngradeData,
} from '../types/types';
import {
  st_humanizedDateTime,
  st_getcreateCharacterData,
  extensionVersion,
  st_echo,
  st_loadWorldInfo,
  st_server_convertWorldInfoToCharacterBook,
  st_setWorldInfoButtonClass,
  st_addWorldInfo,
} from '../config';
import { readScenarioFromPng, writeScenarioToPng } from '../utils/png-handlers';

/**
 * Creates a production-ready version of scenario data without internal state
 */
export async function createProductionScenarioData(
  data: ScenarioCreateData,
  formData: FormData,
): Promise<FullExportData | null> {
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
    version,
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
    jsonData.name = formEntries.find(([key]) => key === 'ch_name')[1] || '';
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

  if (!jsonData.name) {
    st_echo('error', 'Character name is required.');
    return null;
  }

  let character_book: { entries: any[]; name: string } | undefined;
  if (jsonData.world) {
    const file = await st_loadWorldInfo(jsonData.world);
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
    questions: questions.map(({ inputId, text, script, type, defaultValue, required, options, showScript }) => ({
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
    version,
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
        await st_echo('error', 'No scenario data found in PNG file.');
        return null;
      }
      data = extracted;
    } catch (error: any) {
      await st_echo('error', `Failed to read PNG file: ${error.message}`);
      return null;
    }
  } else {
    data = importedData as FullExportData;
  }

  // Show info if no scenario_creator exists
  if (!data.scenario_creator) {
    await st_echo('info', 'No scenario_creator data found. Creating new empty data.');
  }
  // Extract scenario creator specific data or create a new empty data
  let scenarioCreator = data.scenario_creator || createEmptyScenarioExportData();

  // Check version changes
  if (scenarioCreator.version && scenarioCreator.version !== extensionVersion) {
    await st_echo('info', `Imported data version changed from ${scenarioCreator.version} to ${extensionVersion}`);
  }
  try {
    scenarioCreator = upgradeOrDowngradeData(scenarioCreator, 'export');
  } catch (error: any) {
    await st_echo('error', error.message);
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
  const worldName = data.data.extensions?.world;
  if (worldName) {
    $('#character_world').val(worldName);
    await st_addWorldInfo(worldName, data.data.character_book, true);
  }
  st_setWorldInfoButtonClass(undefined, !!worldName);

  const questions = (scenarioCreator.questions || []).map((q: any) => ({
    ...q,
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
    name: data.name || data.data?.name || '',
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
    scriptInputValues: {
      question: {},
      description: {},
      'first-message': {},
      scenario: {},
      personality: {},
      'character-note': {},
    },
    version: scenarioCreator.version,
    worldName: data.data?.extensions?.world,
  };
}

/**
 * Only applies necessary fields in the advanced dialog.
 */
export function applyScenarioExportDataToSidebar(importedData: FullExportData) {
  if ($('#form_create').attr('actiontype') !== 'createcharacter') {
    return;
  }

  if (importedData.data.extensions?.depth_prompt !== undefined) {
    $('#depth_prompt_depth').val(importedData.data.extensions.depth_prompt.depth);
    $('#depth_prompt_role').val(importedData.data.extensions.depth_prompt.role || 'system');
  } else {
    $('#depth_prompt_depth').val(4);
    $('#depth_prompt_role').val('system');
  }
  $('#character_name_pole').val(importedData.name || importedData.data.name || '');
  $('#creator_textarea').val(importedData.data.creator || '');
  $('#creator_notes_textarea').val(importedData.creatorcomment || importedData.data.creator_notes || '');
  $('#tags_textarea').val((importedData.tags || importedData.data.tags || []).join(', '));
  $('#character_version_textarea').val(importedData.data.character_version || '');
  $('#character_world').val(importedData.data.extensions?.world || '');
}
