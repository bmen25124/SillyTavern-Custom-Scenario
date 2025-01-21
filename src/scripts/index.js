import { prepareSettings, prepareCharacterSidebar } from './ui-handlers.js';

jQuery(async () => {
    await prepareSettings();
    await prepareCharacterSidebar();
});
