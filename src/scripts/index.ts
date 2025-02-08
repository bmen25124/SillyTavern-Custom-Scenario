import { prepareCharacterSidebar } from './create/ui-handlers';
import { preparePlayButton } from './play/ui-handlers';

jQuery(async () => {
  await prepareCharacterSidebar();
  await preparePlayButton();
});
