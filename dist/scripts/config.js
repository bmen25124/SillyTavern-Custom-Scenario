import { renderExtensionTemplateAsync } from '../../../../../extensions.js';
import { callGenericPopup, POPUP_TYPE } from '../../../../../popup.js';
import { SlashCommandParser } from '../../../../../slash-commands/SlashCommandParser.js';
import { uuidv4 } from '../../../../../utils.js';
import { getCharacters, getRequestHeaders } from '../../../../../../script.js';
import { humanizedDateTime } from '../../../../../RossAscends-mods.js';

export const extensionName = 'scenario-creator';
export const extensionTemplateFolder = `third-party/${extensionName}/templates`;

export { renderExtensionTemplateAsync, callGenericPopup, POPUP_TYPE, uuidv4, getCharacters, getRequestHeaders, SlashCommandParser, humanizedDateTime };
