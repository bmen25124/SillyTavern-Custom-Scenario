import { renderExtensionTemplateAsync } from '../../../../../extensions.js';
import { callGenericPopup, POPUP_TYPE, POPUP_RESULT } from '../../../../../popup.js';
import { SlashCommandParser } from '../../../../../slash-commands/SlashCommandParser.js';
import { uuidv4 } from '../../../../../utils.js';
import { getCharacters, getRequestHeaders, create_save } from '../../../../../../script.js';
import { humanizedDateTime } from '../../../../../RossAscends-mods.js';

export const extensionName = 'SillyTavern-Custom-Scenario';
export const extensionVersion = '0.2.0';
export const extensionTemplateFolder = `third-party/${extensionName}/templates`;

/**
 * Sends an echo message using the SlashCommandParser's echo command.
 * @async
 * @param {string} severity - The severity level of the echo message.
 * @param {string} message - The message to be echoed.
 * @returns {Promise<void>}
 */
export async function stEcho(severity, message) {
    await SlashCommandParser.commands['echo'].callback({ severity: severity }, message);
}

/**
 * Executes the 'go' slash command to switch to a specified character.
 * @async
 * @param {string} name - The name of the character to switch to.
 * @returns {Promise<void>} A promise that resolves when the character switch is complete.
 */
export async function stGo(name) {
    await SlashCommandParser.commands['go'].callback(undefined, name);
}

export { renderExtensionTemplateAsync, callGenericPopup, POPUP_TYPE, POPUP_RESULT, uuidv4, getCharacters, getRequestHeaders, humanizedDateTime, create_save };
