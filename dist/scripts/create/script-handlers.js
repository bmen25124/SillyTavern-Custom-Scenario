/**
 * Sets up script input update handlers for description and first message tabs
 * @param {JQuery} popup - The scenario creator dialog jQuery element
 * @param {'description'|'first-message'} type - The type of tab to update
 */
export function updateScriptInputs(popup, type) {
    const container = type === 'description'
        ? popup.find('#script-inputs-container')
        : popup.find('#first-message-script-inputs-container');

    // Store existing input values before emptying container
    const existingValues = {};
    container.find('.script-input-group').each(function () {
        const id = $(this).data('id');
        const inputType = $(this).data('type');
        switch (inputType) {
            case 'checkbox':
                existingValues[id] = $(this).find('input[type="checkbox"]').prop('checked');
                break;
            case 'select':
                existingValues[id] = $(this).find('select').val();
                break;
            default:
                existingValues[id] = $(this).find('input[type="text"]').val();
                break;
        }
    });

    container.empty();

    // Create script inputs for the specified tab
    popup.find('.dynamic-input-group').each(function () {
        const id = $(this).find('.input-id').val();
        if (!id) return;

        const inputType = $(this).find('.input-type-select').val();
        let defaultValue;
        switch (inputType) {
            case 'checkbox':
                defaultValue = $(this).find('.input-default-checkbox').prop('checked');
                break;
            case 'select':
                defaultValue = $(this).find('.select-default').val();
                break;
            default:
                defaultValue = $(this).find('.input-default').val();
                break;
        }

        const inputGroup = $(`
            <div class="script-input-group" data-id="${id}" data-type="${inputType}">
                <label for="script-input-${id}-${type}" title="Access using: variables.${id}">${id}:</label>
                ${inputType === 'checkbox'
                ? `<input type="checkbox" id="script-input-${id}-${type}" class="text_pole" ${defaultValue ? 'checked' : ''} title="Access using: variables.${id}">`
                : inputType === 'select'
                    ? `<select id="script-input-${id}-${type}" class="text_pole" title="Access using: variables.${id}.value or variables.${id}.label">
                            ${$(this).find('.select-default').html()}
                           </select>`
                    : `<input type="text" id="script-input-${id}-${type}" class="text_pole" value="${defaultValue || ''}" title="Access using: variables.${id}">`
            }
            </div>
        `);

        container.append(inputGroup);

        // Restore previous value if it exists, otherwise use default
        if (id in existingValues) {
            if (inputType === 'checkbox') {
                inputGroup.find('input[type="checkbox"]').prop('checked', existingValues[id]);
            } else if (inputType === 'select') {
                inputGroup.find('select').val(existingValues[id]);
            } else {
                inputGroup.find('input[type="text"]').val(existingValues[id]);
            }
        } else if (inputType === 'select') {
            // Set the default value only for new inputs
            container.find(`select#script-input-${id}-${type}`).val(defaultValue);
        }
    });
}

/**
 * Updates script inputs for a specific question
 * @param {JQuery} questionGroup - The question group jQuery element
 */
export function updateQuestionScriptInputs(questionGroup) {
    const container = questionGroup.find('.question-script-inputs-container');
    const popup = questionGroup.closest('#scenario-create-dialog');
    const allInputs = popup.find('.dynamic-input-group');

    // Store existing values
    const existingValues = {};
    container.find('.script-input-group').each(function () {
        const id = $(this).data('id');
        const inputType = $(this).data('type');
        switch (inputType) {
            case 'checkbox':
                existingValues[id] = $(this).find('input[type="checkbox"]').prop('checked');
                break;
            case 'select':
                existingValues[id] = $(this).find('select').val();
                break;
            default:
                existingValues[id] = $(this).find('input[type="text"]').val();
                break;
        }
    });

    container.empty();

    // Add script inputs for all questions except self
    allInputs.each(function () {
        const currentQuestionId = $(this).data('tab');
        if (currentQuestionId === questionGroup.data('tab')) {
            return; // Skip self to avoid circular reference
        }

        const id = $(this).find('.input-id').val();
        if (!id) return;

        const inputType = $(this).find('.input-type-select').val();
        let defaultValue;
        switch (inputType) {
            case 'checkbox':
                defaultValue = $(this).find('.input-default-checkbox').prop('checked');
                break;
            case 'select':
                defaultValue = $(this).find('.select-default').val();
                break;
            default:
                defaultValue = $(this).find('.input-default').val();
                break;
        }

        const inputGroup = $(`
            <div class="script-input-group" data-id="${id}" data-type="${inputType}">
                <label for="script-input-${id}-${currentQuestionId}" title="Access using: variables.${id}">${id}:</label>
                ${inputType === 'checkbox'
                ? `<input type="checkbox" id="script-input-${id}-${currentQuestionId}" class="text_pole" ${defaultValue ? 'checked' : ''} title="Access using: variables.${id}">`
                : inputType === 'select'
                    ? `<select id="script-input-${id}-${currentQuestionId}" class="text_pole" title="Access using: variables.${id}.value or variables.${id}.label">
                               ${$(this).find('.select-default').html()}
                           </select>`
                    : `<input type="text" id="script-input-${id}-${currentQuestionId}" class="text_pole" value="${defaultValue || ''}" title="Access using: variables.${id}">`
            }
            </div>
        `);

        container.append(inputGroup);

        // Restore previous value if it exists
        if (id in existingValues) {
            if (inputType === 'checkbox') {
                inputGroup.find('input[type="checkbox"]').prop('checked', existingValues[id]);
            } else if (inputType === 'select') {
                inputGroup.find('select').val(existingValues[id]);
            } else {
                inputGroup.find('input[type="text"]').val(existingValues[id]);
            }
        }
    });
}
