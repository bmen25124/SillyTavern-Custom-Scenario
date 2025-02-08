// @ts-ignore
import {
  getCharacters,
  saveCharacterDebounced,
  extension_prompt_roles,
  getThumbnailUrl,
  // @ts-ignore
} from '../../../../../script.js';
// @ts-ignore
import { humanizedDateTime } from '../../../../RossAscends-mods.js';
// @ts-ignore
import { Popper } from '../../../../../lib.js';
// @ts-ignore
import { getContext } from '../../../../extensions.js';

// @ts-ignore
import dialogPolyfill from '../../../../../lib/dialog-polyfill.esm.js';
// @ts-ignore
// import { shouldSendOnEnter } from '../../../../RossAscends-mods.js';
// @ts-ignore
import { fixToastrForDialogs, Popup as STPopup } from '../../../../popup.js';
// @ts-ignore
import { removeFromArray, runAfterAnimation, uuidv4 } from '../../../../utils.js';

import {
  world_names,
  selected_world_info,
  loadWorldInfo,
  // convertCharacterBook, // not exported
  saveWorldInfo,
  // updateWorldInfoList, // not exported
  newWorldInfoEntryTemplate,
  world_info_position,
  DEFAULT_DEPTH,
  DEFAULT_WEIGHT,
  world_info_logic,
  setWorldInfoButtonClass,
  // @ts-ignore
} from '../../../../world-info.js';

import { FullExportData } from './types/types.js';

export const extensionName = 'SillyTavern-Custom-Scenario';
export const extensionVersion = '0.4.2';

/**
 * Sends an echo message using the SlashCommandParser's echo command.
 */
export async function st_echo(severity: string, message: string): Promise<void> {
  await getContext().SlashCommandParser.commands['echo'].callback({ severity: severity }, message);
}

/**
 * Executes the 'go' slash command to switch to a specified character.
 */
export async function st_go(name: string): Promise<void> {
  await getContext().SlashCommandParser.commands['go'].callback(undefined, name);
}

export function st_getRequestHeaders(): Partial<{
  'Content-Type': string;
  'X-CSRF-Token': string;
}> {
  return getContext().getRequestHeaders();
}

export function st_getcreateCharacterData(): {
  extensions: Record<string, any>;
} {
  return getContext().createCharacterData;
}

// TODO: Get from getContext()
export async function st_updateCharacters(): Promise<void> {
  return await getCharacters();
}

// TODO: Get from getContext()
export function st_humanizedDateTime(): string {
  return humanizedDateTime();
}

export function st_createPopper(
  reference: HTMLElement,
  popper: HTMLElement,
  options?: {
    placement:
      | 'top-start'
      | 'top-end'
      | 'bottom-start'
      | 'bottom-end'
      | 'right-start'
      | 'right-end'
      | 'left-start'
      | 'left-end';
  },
): { update: () => void } {
  return Popper.createPopper(reference, popper, options);
}

/**
 * Note: It doesn't contain the scenario data.
 */
export function st_getCharacters(): FullExportData[] {
  return getContext().characters;
}

export function st_saveCharacterDebounced() {
  return saveCharacterDebounced();
}

export function st_getWorldNames(): string[] {
  return world_names;
}

export async function st_getWorldInfo(worldName: string): Promise<{ entries: any[]; name: string } | null> {
  return await loadWorldInfo(worldName);
}

// https://github.com/SillyTavern/SillyTavern/blob/999da4945aaf1da6f6d4ff1e9e314c11f0ccfeb1/src/endpoints/characters.js#L466
export function st_server_convertWorldInfoToCharacterBook(
  name: string,
  entries: any[],
): { entries: any[]; name: string } {
  const result: { entries: any[]; name: string } = { entries: [], name };

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
export function st_convertCharacterBook(characterBook: { entries: any[]; name: string }): {
  entries: {};
  originalData: any;
} {
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
      position:
        entry.extensions?.position ??
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

export function st_saveWorldInfo(name: string, data: any, immediately = false) {
  return saveWorldInfo(name, data, immediately);
}

export async function st_updateWorldInfoList() {
  const result = await fetch('/api/settings/get', {
    method: 'POST',
    headers: st_getRequestHeaders(),
    body: JSON.stringify({}),
  });

  if (result.ok) {
    var data = await result.json();
    const new_world_names = data.world_names?.length ? data.world_names : [];
    $('#world_info').find('option[value!=""]').remove();
    $('#world_editor_select').find('option[value!=""]').remove();

    new_world_names.forEach((item: string, i: number) => {
      $('#world_info').append(
        `<option value='${i}'${selected_world_info.includes(item) ? ' selected' : ''}>${item}</option>`,
      );
      $('#world_editor_select').append(`<option value='${i}'>${item}</option>`);
    });

    let oldCount = world_names.length;
    for (let i = 0; i < oldCount; i++) {
      world_names.pop();
    }
    for (const new_world_name of new_world_names) {
      world_names.push(new_world_name);
    }
  }
}

export function st_setWorldInfoButtonClass(chid: string | undefined, forceValue?: boolean | undefined) {
  setWorldInfoButtonClass(chid, forceValue);
}

export function st_getThumbnailUrl(type: string, file: string): string {
  return getThumbnailUrl(type, file);
}

/**
 * @returns True if user accepts it.
 */
export async function st_popupConfirm(header: string, text?: string): Promise<boolean> {
  return await getContext().Popup.show.confirm(header, text);
}

/**
 * @returns True if added or already exist. False if user rejected the popup
 */
export async function st_addWorldInfo(
  worldName: string,
  character_book:
    | {
        entries: any[];
        name: string;
      }
    | undefined,
  skipPopup: boolean,
): Promise<boolean> {
  const worldNames = st_getWorldNames();
  if (!worldNames.includes(worldName) && character_book) {
    if (!skipPopup) {
      const confirmation = await st_popupConfirm(
        `Are you sure you want to import '${worldName}'?`,
        `Without lorebook, it will not work as expected.`,
      );
      if (!confirmation) {
        return false;
      }
    }
    const convertedBook = st_convertCharacterBook(character_book);
    st_saveWorldInfo(character_book.name, convertedBook, true);
    await st_updateWorldInfoList();
  }

  return true;
}

export function st_fixToastrForDialogs() {
  fixToastrForDialogs();
}

export function st_removeFromArray(array: any[], item: any) {
  removeFromArray(array, item);
}

export function st_runAfterAnimation(element: any, callback: any) {
  runAfterAnimation(element, callback);
}

export function st_uuidv4() {
  return uuidv4();
}

export { STPopup, dialogPolyfill };
