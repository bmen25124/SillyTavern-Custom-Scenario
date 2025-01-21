import { prepareSettings, prepareCharacterSidebar } from './ui-create-handlers.js';
import { preparePlayButton } from './ui-play-handlers.js';

jQuery(async () => {
    await prepareSettings();
    await prepareCharacterSidebar();
    await preparePlayButton();
});
