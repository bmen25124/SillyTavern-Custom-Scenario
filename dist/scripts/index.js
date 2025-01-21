import { prepareSettings, prepareCharacterSidebar } from './ui-create-handlers.js';

jQuery(async () => {
    await prepareSettings();
    await prepareCharacterSidebar();
});
