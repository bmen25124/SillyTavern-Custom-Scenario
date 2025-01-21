import { renderExtensionTemplateAsync } from '../../../../../extensions.js';
import { callGenericPopup, POPUP_TYPE } from '../../../../../popup.js';
import { uuidv4 } from '../../../../../utils.js';

export const extensionName = 'scenario-creator';
export const extensionTemplateFolder = `third-party/${extensionName}/templates`;

export { renderExtensionTemplateAsync, callGenericPopup, POPUP_TYPE, uuidv4 };
