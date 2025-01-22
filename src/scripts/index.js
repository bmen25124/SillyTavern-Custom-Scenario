import { prepareSettings, prepareCharacterSidebar } from './create/ui-handlers.js';
import { preparePlayButton } from './play/ui-handlers.js';

jQuery(async () => {
    await prepareSettings();
    await prepareCharacterSidebar();
    await preparePlayButton();
});
