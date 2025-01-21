import { WizardCommandGenerator, QuestionType } from '../scripts/converter/WizardCommandGenerator.js';

describe('WizardCommandGenerator', () => {
    let generator;

    beforeEach(() => {
        const testConfig = {
            questions: [
                {
                    question: "What is your name?",
                    type: QuestionType.TEXTBOX,
                    varname: "name",
                    defaultValue: "John Doe"
                },
                {
                    question: "Your bio",
                    type: QuestionType.TEXTAREA,
                    varname: "bio"
                },
                {
                    question: "Is this a hero?",
                    type: QuestionType.CHECKBOX,
                    varname: "is_hero",
                    defaultValue: true
                },
                {
                    question: "Choose class",
                    type: QuestionType.SELECT,
                    varname: "class",
                    defaultValue: "warrior",
                    options: {
                        "warrior": "Warrior",
                        "mage": "Mage"
                    }
                }
            ],
            layout: [
                {
                    title: "Basic Info",
                    questions: ["name", "bio"]
                },
                {
                    title: "Character",
                    questions: ["is_hero", "class"]
                }
            ],
            firstMessages: [
                {
                    name: "system",
                    value: "Hello {{name}}!"
                }
            ]
        };
        generator = new WizardCommandGenerator(testConfig);
    });

    test('escapeQuotes handles quotes correctly', () => {
        expect(generator.escapeQuotes('test "quoted" text')).toBe('test \\"quoted\\" text');
    });

    test('generateTextbox creates correct command', () => {
        const expected = '/wiz-page-textbox label="What is your name?" var="name" "John Doe"';
        expect(generator.generateTextbox("name")).toBe(expected);
    });

    test('generateTextarea creates correct command', () => {
        const expected = '/wiz-page-textarea label="Your bio" var="bio" ""';
        expect(generator.generateTextbox("bio")).toBe(expected);
    });

    test('generateCheckbox creates correct command', () => {
        const expected = '/wiz-page-checkbox label="Is this a hero?" var="is_hero" checked="true"';
        expect(generator.generateCheckbox("is_hero")).toBe(expected);
    });

    test('generateSelect creates correct command', () => {
        const expected = '/wiz-page-select label="Choose class" var="class" selected=warrior "warrior::Warrior, mage::Mage"';
        expect(generator.generateSelect("class")).toBe(expected);
    });

    test('generatePage creates formatted page', () => {
        const page = {
            title: "Basic Info",
            questions: ["name"]
        };
        const result = generator.generatePage(page);
        expect(result).toContain('/wiz-page title="Basic Info"');
        expect(result).toContain('/wiz-page-textbox');
        expect(result).toContain('/setvar key=name {{wizvar::name}}');
    });

    test('validateMessageVariables finds unknown variables', () => {
        const message = {
            name: "test",
            value: "Hello {{name}} {{unknown}}"
        };
        expect(generator.validateMessageVariables(message)).toEqual(["unknown"]);
    });

    test('generate creates complete wizard command', () => {
        const result = generator.generate();
        expect(result).toContain('/wizard title="Simple Wizard"');
        expect(result).toContain('/wiz-nav');
        expect(result).toContain('/sys Hello {{getvar::name}}!');
    });
});
