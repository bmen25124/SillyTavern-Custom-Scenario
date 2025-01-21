import { renderExtensionTemplateAsync } from '../../../../../../public/scripts/extensions.js';
import { callGenericPopup, POPUP_TYPE } from '../../../../../../public/scripts/popup.js';
import { SlashCommandParser } from '../../../../../../public/scripts/slash-commands/SlashCommandParser.js';
import { uuidv4 } from '../../../../../../public/scripts/utils.js';
import { getCharacters, getRequestHeaders } from '../../../../../../public/script.js';

export const extensionName = 'scenario-creator';
export const extensionTemplateFolder = `third-party/${extensionName}/templates`;

export { renderExtensionTemplateAsync, callGenericPopup, POPUP_TYPE, uuidv4, getCharacters, getRequestHeaders, SlashCommandParser };
