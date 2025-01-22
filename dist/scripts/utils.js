export function executeScript(script, answers) {
    // Clone answers to avoid modifying the original object
    const variables = JSON.parse(JSON.stringify(answers));

    // Create a function that returns all variables
    const scriptFunction = new Function('answers', `
        let variables = JSON.parse('${JSON.stringify(variables)}');
        ${script}
        return variables;
    `);

    return scriptFunction(variables);
}

export function interpolateText(template, variables) {
    let result = template;
    const regex = /\{\{([^}]+)\}\}/g;
    let maxIterations = 10; // Prevent infinite recursion
    let iteration = 0;

    while (result.includes('{{') && iteration < maxIterations) {
        result = result.replace(regex, (match, key) => {
            const variable = variables[key];
            if (variable === undefined || variable === null || variable === '') {
                return match; // Keep original if variable is undefined, null, or empty
            }
            // Recursively interpolate if the variable contains template syntax
            return variable.toString().includes('{{')
                ? interpolateText(variable.toString(), variables)
                : variable;
        });
        iteration++;
    }

    return result;
}
