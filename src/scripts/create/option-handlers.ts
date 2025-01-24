/**
 * Sets up handlers for select options
 */
export function setupOptionHandlers(
  newOption: JQuery<HTMLElement>,
  optionsList: JQuery<HTMLElement>,
  selectDefault: JQuery<HTMLElement>,
) {
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
 */
export function updateDefaultOptions(optionsList: JQuery<HTMLElement>, selectDefault: JQuery<HTMLElement>) {
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
    selectDefault.val(currentValue!);
  }
}

/**
 * Sets up functionality for adding options to select inputs
 */
export function setupAddOptionButton(newInput: JQuery<HTMLElement>, popup: JQuery<HTMLElement>) {
  newInput.find('.add-option-btn').on('click', function () {
    const optionsList = $(this).closest('.select-options-container').find('.options-list');
    const optionTemplate = popup.find('#select-option-template').html();
    const newOption = $(optionTemplate);
    const selectDefault = $(this).closest('.dynamic-input-group').find('.select-default');

    setupOptionHandlers(newOption, optionsList, selectDefault);
    optionsList.append(newOption);
  });
}
