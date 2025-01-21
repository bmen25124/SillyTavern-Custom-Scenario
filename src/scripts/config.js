import { renderExtensionTemplateAsync } from '../../../../../../public/scripts/extensions.js';
import { callGenericPopup, POPUP_TYPE } from '../../../../../../public/scripts/popup.js';
import { uuidv4 } from '../../../../../../public/scripts/utils.js';

export const extensionName = 'scenario-creator';
export const extensionTemplateFolder = `third-party/${extensionName}/templates`;

export { renderExtensionTemplateAsync, callGenericPopup, POPUP_TYPE, uuidv4 };
