/**
 * @param emptyStrategy if it's variableName, null/undefined/empty values would be shown as `{{variable}}`. Otherwise, it will show as empty strings.
 */
export function executeMainScript(
  script: string,
  answers: {},
  emptyStrategy: 'variableName' | 'remove',
): Record<string, string | boolean | { label: string; value: string }> {
  // Clone answers to avoid modifying the original object
  const variables = JSON.parse(JSON.stringify(answers));

  // First interpolate any variables in the script
  const interpolatedScript = interpolateText(script, variables, emptyStrategy);

  // Create a function that returns all variables
  const scriptFunction = new Function(
    'answers',
    `
        let variables = JSON.parse(JSON.stringify(${JSON.stringify(variables)}));
        ${interpolatedScript}
        return variables;
    `,
  );

  return scriptFunction(variables);
}

/**
 * @param emptyStrategy if it's variableName, null/undefined/empty values would be shown as `{{variable}}`. Otherwise, it will show as empty strings.
 */
export function executeShowScript(script: string, answers: {}, emptyStrategy: 'variableName' | 'remove'): boolean {
  // Clone answers to avoid modifying the original object
  const variables = JSON.parse(JSON.stringify(answers));

  // First interpolate any variables in the script
  const interpolatedScript = interpolateText(script, variables, emptyStrategy);

  // Create a function that returns all variables
  const scriptFunction = new Function(
    'answers',
    `
        let variables = JSON.parse(JSON.stringify(${JSON.stringify(variables)}));
        ${interpolatedScript}
    `,
  );

  return scriptFunction(variables);
}

/**
 * @param emptyStrategy if it's variableName, null/undefined/empty values would be shown as `{{variable}}`. Otherwise, it will show as empty strings.
 */
export function interpolateText(
  template: string,
  variables: Record<string, string | boolean | { label: string; value: string }>,
  emptyStrategy: 'variableName' | 'remove',
): string {
  const newVariables = JSON.parse(JSON.stringify(variables));
  for (const [key, value] of Object.entries(variables)) {
    if (value && typeof value === 'object' && value.hasOwnProperty('label')) {
      newVariables[key] = value.label;
    }
  }

  let result = template;
  const regex = /\{\{([^}]+)\}\}/g;
  let maxIterations = 10; // Prevent infinite recursion
  let iteration = 0;

  while (result.includes('{{') && iteration < maxIterations) {
    result = result.replace(regex, (match, key) => {
      let value = newVariables[key];
      if (typeof value === 'string') {
        value = value.trim();
      }
      if (emptyStrategy === 'variableName' && (value === undefined || value === null || value === '')) {
        return match; // Keep original if variable is undefined, null, or empty
      } else if (!value) {
        return '';
      }
      // Recursively interpolate if the variable contains template syntax
      return value.toString().includes('{{') ? interpolateText(value.toString(), newVariables, emptyStrategy) : value;
    });
    iteration++;
  }

  return result;
}
