/** @enum {string} */
export const QuestionType = {
    TEXTBOX: 'textbox',
    TEXTAREA: 'textarea',
    CHECKBOX: 'checkbox',
    SELECT: 'select'
};

/**
 * @typedef {Object} QuestionConfig
 * @property {string} varname - Variable name for the question
 * @property {string} question - The question text
 * @property {QuestionType} type - Type of question input
 * @property {*} [defaultValue] - Default value for the question
 * @property {Object.<string, string>} [options] - Options for select type (value: label pairs)
 */

/**
 * Represents a wizard question
 */
class Question {
    /**
     * @param {QuestionConfig} config
     */
    constructor({ varname, question, type, defaultValue, options }) {
        this.varname = varname;
        this.question = question;
        this.type = type;
        this.defaultValue = defaultValue;
        this.options = options;
    }
}

/**
 * @typedef {Object} WizardConfig
 * @property {QuestionConfig[]} questions - Array of questions
 * @property {Array<{title: string, questions: string[]}>} layout - Page layout configuration
 * @property {Array<{name: string, value: string}>} [firstMessages] - Initial messages
 * @property {string[]} [ignoreGetvar] - Variables to ignore for getvar conversion
 */

/**
 * Generates wizard commands from configuration
 */
export class WizardCommandGenerator {
    /**
     * @param {WizardConfig} config
     */
    constructor(config) {
        this.config = config;
        this.questions = Object.fromEntries(
            config.questions.map(q => [q.varname, new Question(q)])
        );
        this.indent = "    ";
    }

    /**
     * Escapes quotes in text for command generation
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeQuotes(text) {
        return text?.replace(/"/g, '\\"') ?? "";
    }

    /**
     * Generates textbox or textarea command
     * @param {string} questionName - Name of the question
     * @returns {string} Generated command
     */
    generateTextbox(questionName) {
        const question = this.questions[questionName];
        const label = this.escapeQuotes(question.question);
        const defaultValue = this.escapeQuotes(question.defaultValue);

        return question.type === QuestionType.TEXTAREA
            ? `/wiz-page-textarea label="${label}" var="${questionName}" "${defaultValue}"`
            : `/wiz-page-textbox label="${label}" var="${questionName}" "${defaultValue}"`;
    }

    /**
     * Generates checkbox command
     * @param {string} questionName - Name of the question
     * @returns {string} Generated command
     */
    generateCheckbox(questionName) {
        const question = this.questions[questionName];
        const label = this.escapeQuotes(question.question);
        const checked = question.defaultValue?.toString().toLowerCase() ?? "false";

        return `/wiz-page-checkbox label="${label}" var="${questionName}" checked="${checked}"`;
    }

    /**
     * Generates select command
     * @param {string} questionName - Name of the question
     * @returns {string} Generated command
     */
    generateSelect(questionName) {
        const question = this.questions[questionName];
        const label = this.escapeQuotes(question.question);

        if (!question.options) {
            throw new Error(`Select question ${questionName} must have options`);
        }

        const optionsStr = Object.entries(question.options)
            .map(([k, v]) => `${k}::${this.escapeQuotes(v)}`)
            .join(", ");

        const selected = question.defaultValue ?? Object.keys(question.options)[0];

        return `/wiz-page-select label="${label}" var="${questionName}" selected=${selected} "${optionsStr}"`;
    }

    /**
     * Generates page content
     * @param {{title: string, questions: string[]}} page - Page configuration
     * @returns {string} Generated page command
     */
    generatePage(page) {
        const title = this.escapeQuotes(page.title);
        const baseIndent = this.indent;

        const pageContent = page.questions.map(q => {
            const question = this.questions[q];
            switch (question.type) {
                case QuestionType.CHECKBOX: return this.generateCheckbox(q);
                case QuestionType.SELECT: return this.generateSelect(q);
                case QuestionType.TEXTBOX:
                case QuestionType.TEXTAREA: return this.generateTextbox(q);
                default: throw new Error(`Unsupported question type: ${question.type}`);
            }
        });

        const afterContent = page.questions.map(q =>
            `/setvar key=${q} {{wizvar::${q}}}`
        );

        return `${baseIndent}/wiz-page title="${title}" {:
${baseIndent}${this.indent}${pageContent.join(` |\n${baseIndent}${this.indent}`)} |
${baseIndent}${this.indent}/wiz-page-after {:
${baseIndent}${this.indent}${this.indent}${afterContent.join(` |\n${baseIndent}${this.indent}${this.indent}`)} |
${baseIndent}${this.indent}:}} |
${baseIndent}:}} |`;
    }

    /**
     * Validates message variables
     * @param {{name: string, value: string}} message - Message to validate
     * @returns {string[]} Unknown variables
     */
    validateMessageVariables(message) {
        const variables = [...message.value.matchAll(/\{\{(\w+)\}\}/g)]
            .map(match => match[1]);

        return variables.filter(v => !this.questions[v]);
    }

    /**
     * Generates first messages
     * @returns {string} Generated messages
     */
    generateFirstMessages() {
        if (!this.config.firstMessages?.length) return "";

        return this.config.firstMessages.map(message => {
            let { name, value } = message;

            // Convert {{var}} to {{getvar::var}}
            const replaceVar = (text) => {
                return text.replace(/\{\{(\w+)\}\}/g, (_, var_) =>
                    this.config.ignoreGetvar?.includes(var_)
                        ? `{{${var_}}}`
                        : `{{getvar::${var_}}}`
                );
            };

            name = replaceVar(name);
            value = replaceVar(value);

            return name === "system"
                ? `/sys ${value} |`
                : `/send name=${name} ${value} |`;
        }).join("\n");
    }

    /**
     * Generates complete wizard command
     * @returns {string} Generated wizard command
     */
    generate() {
        const pages = this.config.layout.map(page => this.generatePage(page));
        const firstMessages = this.generateFirstMessages();

        let output = `/wizard title="Simple Wizard" {:
${this.indent}/wiz-nav |
${pages.join("\n")}
:}} |`;

        if (firstMessages) {
            output += "\n" + firstMessages;
        }

        return output;
    }
}
