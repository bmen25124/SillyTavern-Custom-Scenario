import { prepareCharacterSidebar } from './create/ui-handlers.js';
import { preparePlayButton } from './play/ui-handlers.js';

jQuery(async () => {
    await prepareCharacterSidebar();
    await preparePlayButton();
});
