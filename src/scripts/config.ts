// @ts-ignore
import { uuidv4 } from '../../../../utils.js';
// @ts-ignore
import { getCharacters } from '../../../../../script.js';
// @ts-ignore
import { humanizedDateTime } from '../../../../RossAscends-mods.js';
// @ts-ignore
import { Popper } from '../../../../../lib.js';

// @ts-ignore
import { getContext } from '../../../../extensions.js';

export const extensionName = 'SillyTavern-Custom-Scenario';
export const extensionVersion = '0.3.0';
export const extensionTemplateFolder = `third-party/${extensionName}/templates`;

/**
 * Sends an echo message using the SlashCommandParser's echo command.
 */
export async function stEcho(severity: string, message: string): Promise<void> {
  await getContext().SlashCommandParser.commands['echo'].callback({ severity: severity }, message);
}

/**
 * Executes the 'go' slash command to switch to a specified character.
 */
export async function stGo(name: string): Promise<void> {
  await getContext().SlashCommandParser.commands['go'].callback(undefined, name);
}

export function renderExtensionTemplateAsync(
  extensionName: string,
  templateId: string,
  templateData?: object,
  sanitize?: boolean,
  localize?: boolean,
): Promise<string> {
  return getContext().renderExtensionTemplateAsync(extensionName, templateId, templateData, sanitize, localize);
}

export enum POPUP_TYPE {
  TEXT = 1,
  CONFIRM = 2,
  INPUT = 3,
  DISPLAY = 4,
  CROP = 5,
}

export enum POPUP_RESULT {
  AFFIRMATIVE = 1,
  NEGATIVE = 0,
  // @ts-ignore - not typed
  CANCELLED = null,
}

interface PopupOptions {
  [key: string]: any;
}

export function callGenericPopup(
  content: JQuery<HTMLElement> | string | Element,
  type: POPUP_TYPE,
  inputValue?: string,
  popupOptions?: PopupOptions,
): Promise<POPUP_RESULT | string | boolean | null> {
  return getContext().callGenericPopup(content, type, inputValue, popupOptions);
}

export function getRequestHeaders(): Partial<{
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
export function st_uuidv4(): string {
  return uuidv4();
}

// TODO: Get from getContext()
export async function st_getCharacters(): Promise<void> {
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
