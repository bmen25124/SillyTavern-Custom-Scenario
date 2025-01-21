import { renderExtensionTemplateAsync } from '../../../../../../public/scripts/extensions.js';
import { callGenericPopup, POPUP_TYPE, POPUP_RESULT } from '../../../../../../public/scripts/popup.js';
import { SlashCommandParser } from '../../../../../../public/scripts/slash-commands/SlashCommandParser.js';
import { uuidv4 } from '../../../../../../public/scripts/utils.js';
import { getCharacters, getRequestHeaders } from '../../../../../../public/script.js';
import { humanizedDateTime } from '../../../../../../public/scripts/RossAscends-mods.js';

export const extensionName = 'scenario-creator';
export const extensionTemplateFolder = `third-party/${extensionName}/templates`;

export { renderExtensionTemplateAsync, callGenericPopup, POPUP_TYPE, POPUP_RESULT, uuidv4, getCharacters, getRequestHeaders, SlashCommandParser, humanizedDateTime };
