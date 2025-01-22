/**
 * Sets up handlers for select options
 * @param {JQuery} newOption - The new option jQuery element
 * @param {JQuery} optionsList - The options list jQuery element
 * @param {JQuery} selectDefault - The select default jQuery element
 */
export function setupOptionHandlers(newOption, optionsList, selectDefault) {
    newOption.find('.option-value, .option-label').on('input', function () {
        updateDefaultOptions(optionsList, selectDefault);
    });

    newOption.find('.remove-option-btn').on('click', function () {
        $(this).closest('.option-item').remove();
        updateDefaultOptions(optionsList, selectDefault);
    });
}

/**
 * Updates the default options for a select input
 * @param {JQuery} optionsList - The options list jQuery element
 * @param {JQuery} selectDefault - The select default jQuery element
 */
export function updateDefaultOptions(optionsList, selectDefault) {
    // Store current selection
    const currentValue = selectDefault.val();

    // Clear existing options except the placeholder
    selectDefault.find('option:not(:first)').remove();

    // Add new options
    optionsList.find('.option-item').each(function () {
        const value = $(this).find('.option-value').val();
        const label = $(this).find('.option-label').val();
        if (value && label) {
            selectDefault.append(`<option value="${value}">${label}</option>`);
        }
    });

    // Restore previous selection if it still exists
    if (selectDefault.find(`option[value="${currentValue}"]`).length) {
        selectDefault.val(currentValue);
    }
}

/**
 * Sets up functionality for adding options to select inputs
 * @param {JQuery} newInput - The new input jQuery element
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 */
export function setupAddOptionButton(newInput, popup) {
    newInput.find('.add-option-btn').on('click', function () {
        const optionsList = $(this).closest('.select-options-container').find('.options-list');
        const optionTemplate = popup.find('#select-option-template').html();
        const newOption = $(optionTemplate);
        const selectDefault = $(this).closest('.dynamic-input-group').find('.select-default');

        setupOptionHandlers(newOption, optionsList, selectDefault);
        optionsList.append(newOption);
    });
}
