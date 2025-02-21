// @ts-ignore
import {
  saveCharacterDebounced,
  getThumbnailUrl,
  // @ts-ignore
} from '../../../../../script.js';
// @ts-ignore
import { Popper, hljs } from '../../../../../lib.js';

// @ts-ignore
import dialogPolyfill from '../../../../../lib/dialog-polyfill.esm.js';
// @ts-ignore
// import { shouldSendOnEnter } from '../../../../RossAscends-mods.js';
// @ts-ignore
import { fixToastrForDialogs, Popup as STPopup } from '../../../../popup.js';
// @ts-ignore
import { removeFromArray, runAfterAnimation } from '../../../../utils.js';

import {
  world_names,
  loadWorldInfo,
  setWorldInfoButtonClass,
  // @ts-ignore
} from '../../../../world-info.js';

import { FullExportData } from './types/types.js';

export const extensionName = 'SillyTavern-Custom-Scenario';
export const extensionVersion = '0.4.5';

/**
 * Sends an echo message using the SlashCommandParser's echo command.
 */
export async function st_echo(severity: string, message: string): Promise<void> {
  // @ts-ignore
  await SillyTavern.getContext().SlashCommandParser.commands['echo'].callback({ severity: severity }, message);
}

/**
 * Executes the 'go' slash command to switch to a specified character.
 */
export async function st_go(name: string): Promise<void> {
  // @ts-ignore
  await SillyTavern.getContext().SlashCommandParser.commands['go'].callback(undefined, name);
}

export function st_getRequestHeaders(): Partial<{
  'Content-Type': string;
  'X-CSRF-Token': string;
}> {
  return SillyTavern.getContext().getRequestHeaders();
}

export function st_getcreateCharacterData(): {
  extensions: Record<string, any>;
} {
  return SillyTavern.getContext().createCharacterData;
}

export async function st_updateCharacters(): Promise<void> {
  return await SillyTavern.getContext().getCharacters();
}

export function st_humanizedDateTime(): string {
  return SillyTavern.getContext().humanizedDateTime();
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
  return SillyTavern.getContext().characters;
}

export function st_saveCharacterDebounced() {
  return saveCharacterDebounced();
}

export function st_getWorldNames(): string[] {
  return world_names;
}

export async function st_loadWorldInfo(worldName: string): Promise<{ entries: any[]; name: string } | null> {
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

export function st_convertCharacterBook(characterBook: { entries: any[]; name: string }): {
  entries: {};
  originalData: any;
} {
  return SillyTavern.getContext().convertCharacterBook(characterBook);
}

export function st_saveWorldInfo(name: string, data: any, immediately = false) {
  return SillyTavern.getContext().saveWorldInfo(name, data, immediately);
}

export async function st_updateWorldInfoList() {
  await SillyTavern.getContext().updateWorldInfoList();
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
  // @ts-ignore
  return await SillyTavern.getContext().Popup.show.confirm(header, text);
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
      const confirmation = await st_popupConfirm(`Import lorebook named '${worldName}'`, 'Higly recommended');
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
  return SillyTavern.getContext().uuidv4();
}

export { STPopup, dialogPolyfill, hljs };
