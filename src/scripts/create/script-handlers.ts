/**
 * Sets up script input update handlers for all tabs
 */
export function updateScriptInputs(
  popup: JQuery<HTMLElement>,
  type: 'description' | 'first-message' | 'scenario' | 'personality' | 'character-note',
) {
  const config = {
    description: {
      containerId: '#script-inputs-container',
    },
    'first-message': {
      containerId: '#first-message-script-inputs-container',
    },
    scenario: {
      containerId: '#scenario-script-inputs-container',
    },
    personality: {
      containerId: '#personality-script-inputs-container',
    },
    'character-note': {
      containerId: '#character-note-script-inputs-container',
    },
  };

  const container = popup.find(config[type].containerId);

  // Store existing input values before emptying container
  const existingValues: Record<string, boolean | string> = {};
  container.find('.script-input-group').each(function () {
    const id = $(this).data('id');
    const inputType = $(this).data('type');
    switch (inputType) {
      case 'checkbox':
        existingValues[id] = $(this).find('input[type="checkbox"]').prop('checked');
        break;
      case 'select':
        existingValues[id] = $(this).find('select').val() as string;
        break;
      default:
        existingValues[id] = $(this).find('input[type="text"]').val() as string;
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

    const helpText =
      inputType === 'select'
        ? 'Access using: variables.' + id + '.value and variables.' + id + '.label'
        : 'Access using: variables.' + id;

    const inputGroup = $(`
            <div class="script-input-group" data-id="${id}" data-type="${inputType}">
                <label for="script-input-${id}-${type}" title="${helpText}">${id}:</label>
                ${
                  inputType === 'checkbox'
                    ? `<input type="checkbox" id="script-input-${id}-${type}" class="text_pole" ${defaultValue ? 'checked' : ''} title="${helpText}">`
                    : inputType === 'select'
                      ? `<select id="script-input-${id}-${type}" class="text_pole" title="${helpText}">
                            ${$(this).find('.select-default').html()}
                           </select>`
                      : `<input type="text" id="script-input-${id}-${type}" class="text_pole" value="${defaultValue || ''}" title="${helpText}">`
                }
            </div>
        `);

    container.append(inputGroup);

    // Restore previous value if it exists, otherwise use default
    if (String(id) in existingValues) {
      if (inputType === 'checkbox') {
        inputGroup.find('input[type="checkbox"]').prop('checked', existingValues[id as string]);
      } else if (inputType === 'select') {
        inputGroup.find('select').val(existingValues[id as string] as string);
      } else {
        inputGroup.find('input[type="text"]').val(existingValues[id as string] as string);
      }
    } else if (inputType === 'select') {
      // Set the default value only for new inputs
      container.find(`select#script-input-${id}-${type}`).val(defaultValue);
    }
  });
}

/**
 * Updates script inputs for a specific question
 */
export function updateQuestionScriptInputs(questionGroup: JQuery<HTMLElement>) {
  const container = questionGroup.find('.question-script-inputs-container');
  const popup = questionGroup.closest('#scenario-create-dialog');
  const allInputs = popup.find('.dynamic-input-group');

  // Store existing values
  const existingValues: Record<string, boolean | string> = {};
  container.find('.script-input-group').each(function () {
    const id = $(this).data('id');
    const inputType = $(this).data('type');
    switch (inputType) {
      case 'checkbox':
        existingValues[id] = $(this).find('input[type="checkbox"]').prop('checked');
        break;
      case 'select':
        existingValues[id] = $(this).find('select').val() as string;
        break;
      default:
        existingValues[id] = $(this).find('input[type="text"]').val() as string;
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

    const helpText =
      inputType === 'select'
        ? 'Access using: variables.' + id + '.value and variables.' + id + '.label'
        : 'Access using: variables.' + id;
    const inputGroup = $(`
            <div class="script-input-group" data-id="${id}" data-type="${inputType}">
                <label for="script-input-${id}-${currentQuestionId}" title="${helpText}">${id}:</label>
                ${
                  inputType === 'checkbox'
                    ? `<input type="checkbox" id="script-input-${id}-${currentQuestionId}" class="text_pole" ${defaultValue ? 'checked' : ''} title="${helpText}">`
                    : inputType === 'select'
                      ? `<select id="script-input-${id}-${currentQuestionId}" class="text_pole" title="${helpText}">
                               ${$(this).find('.select-default').html()}
                           </select>`
                      : `<input type="text" id="script-input-${id}-${currentQuestionId}" class="text_pole" value="${defaultValue || ''}" title="${helpText}">`
                }
            </div>
        `);

    container.append(inputGroup);

    // Restore previous value if it exists
    if (String(id) in existingValues) {
      if (inputType === 'checkbox') {
        inputGroup.find('input[type="checkbox"]').prop('checked', existingValues[id as string]);
      } else if (inputType === 'select') {
        inputGroup.find('select').val(existingValues[id as string] as string);
      } else {
        inputGroup.find('input[type="text"]').val(existingValues[id as string] as string);
      }
    }
  });
}
