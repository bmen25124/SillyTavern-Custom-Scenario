import { st_getWorldInfo } from './config';

/**
 * @param emptyStrategy if it's variableName, null/undefined/empty values would be shown as `{{variable}}`. Otherwise, it will show as empty strings.
 */
export async function executeMainScript(
  script: string,
  answers: {},
  emptyStrategy: 'variableName' | 'remove',
  worldName: string | undefined,
): Promise<Record<string, string | boolean | { label: string; value: string }>> {
  if (!script) return answers;
  // Clone answers to avoid modifying the original object
  const variables = JSON.parse(JSON.stringify(answers));

  // First interpolate any variables in the script
  const interpolatedScript = interpolateText(script, variables, emptyStrategy);

  // Create a function that returns all variables
  const scriptFunction = new Function(
    'variables',
    'world',
    `
        return (async () => {
            ${interpolatedScript}
            return await Promise.resolve(variables);
        })();
    `,
  );

  return scriptFunction(JSON.parse(JSON.stringify(variables)), {
    getAll: async (params: { name?: string; keyword: string }) =>
      await getWorldInfoContent({
        name: params.name ?? worldName,
        keyword: params.keyword,
      }),
    getFirst: async (params: { name?: string; keyword: string }) =>
      await getFirstWorldInfoContent({
        name: params.name ?? worldName,
        keyword: params.keyword,
      }),
  });
}

/**
 * @param emptyStrategy if it's variableName, null/undefined/empty values would be shown as `{{variable}}`. Otherwise, it will show as empty strings.
 */
export function executeShowScript(
  script: string,
  answers: {},
  emptyStrategy: 'variableName' | 'remove',
  _worldName: string | undefined,
): boolean {
  if (!script) return true;
  // Clone answers to avoid modifying the original object
  const variables = JSON.parse(JSON.stringify(answers));

  // First interpolate any variables in the script
  const interpolatedScript = interpolateText(script, variables, emptyStrategy);

  // Create a function that returns all variables
  const scriptFunction = new Function(
    'variables',
    `
        ${interpolatedScript}
    `,
  );

  return scriptFunction(JSON.parse(JSON.stringify(variables)));
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

interface WIEntry {
  id: string;
  keys: string[];
  content: string;
}

/**
 * Checks if keyword is matching the entry keys.
 * @returns null if world info is not found.
 */
export async function getWorldInfoContent(params: { name?: string; keyword: string }): Promise<WIEntry[] | null> {
  if (!params.name) {
    return null;
  }
  const worldInfo = await st_getWorldInfo(params.name);
  if (!worldInfo) {
    return null;
  }

  const result: WIEntry[] = [];
  for (const entry of Object.values(worldInfo.entries)) {
    for (const key of entry.key) {
      if (key.toLowerCase().includes(params.keyword.toLowerCase())) {
        result.push({
          id: entry.uid,
          keys: entry.key,
          content: entry.content,
        });
        break;
      }
    }
  }

  return result;
}

export async function getFirstWorldInfoContent(params: { name?: string; keyword: string }): Promise<WIEntry | null> {
  const result = await getWorldInfoContent(params);
  return result?.[0] ?? null;
}
