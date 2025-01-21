// import { SlashCommandParser } from '../../../../../slash-commands/SlashCommandParser.js';
// import { SlashCommand } from '../../../../../slash-commands/SlashCommand.js';
import { renderExtensionTemplateAsync } from '../../../../../extensions.js';
// import { echoCallback } from '../../../../../slash-commands.js';
import { callGenericPopup, POPUP_TYPE } from '../../../../../popup.js';

const extensionName = 'scenario-creator';
const extensionTemplateFolder = `third-party/${extensionName}/templates`;

// SlashCommandParser.addCommandObject(SlashCommand.fromProps({
//     aliases: ['testalias'],
//     name: 'testname',
//     helpString: 'testhelp',
// }));

jQuery(async () => {
    await prepareSettings();
    await prepareCharacterSidebar();
});

async function prepareSettings() {
    const settingsHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'settings'));
    $('#extensions_settings').append(settingsHtml);
}

async function prepareCharacterSidebar() {
    const characterSidebarIconHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'character-sidebar-icon'));
    $('.form_create_bottom_buttons_block').prepend(characterSidebarIconHtml);
    const characterSidebarIcon = $('#character-sidebar-icon');

    characterSidebarIcon.on('click', async () => {
        let formElement = $('#form_create');
        if (formElement.length === 0) {
            // echoCallback({}, 'Character creation form not found');
            return;
        }
        formElement = formElement.get(0);

        const formData = new FormData(formElement);
        const scenarioCreateDialogHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-create-dialog', {
            description: formData.get('description'),
            first_message: formData.get('first_mes'),
        }));
        await callGenericPopup(scenarioCreateDialogHtml, POPUP_TYPE.TEXT, '', { okButton: true, cancelButton: true });
    });
}
