import { SlashCommandParser } from '../../../../../../public/scripts/slash-commands/SlashCommandParser.js';
import { SlashCommand } from '../../../../../../public/scripts/slash-commands/SlashCommand.js';
import { renderExtensionTemplateAsync } from '../../../../../../public/scripts/extensions.js';
import { callGenericPopup, POPUP_TYPE } from '../../../../../../public/scripts/popup.js';

const extensionName = 'scenario-creator';
const extensionTemplateFolder = `third-party/${extensionName}/templates`;

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    aliases: ['testalias'],
    name: 'testname',
    helpString: 'testhelp',
}));

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

    const scenarioCreateDialogHtml = $(await renderExtensionTemplateAsync(extensionTemplateFolder, 'scenario-create-dialog'));

    characterSidebarIcon.on('click', async () => {
        await callGenericPopup(scenarioCreateDialogHtml, POPUP_TYPE.TEXT, '', { okButton: true, cancelButton: true });
    });
}
