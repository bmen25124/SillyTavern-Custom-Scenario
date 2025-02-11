import { extensionVersion } from '../config';

export type CoreTab = 'description' | 'first-message' | 'scenario' | 'personality' | 'character-note' | 'question';
export type TabId = CoreTab | string; // question tabs are starting with 'question-'

export const CORE_TABS: CoreTab[] = ['description', 'first-message', 'scenario', 'personality', 'character-note'];

export type ScriptInputValues = {
  question: Record<string, Record<string, string>>; // questionId -> inputId -> value
  description: Record<string, string>; // inputId -> value
  'first-message': Record<string, string>; // inputId -> value
  scenario: Record<string, string>; // inputId -> value
  personality: Record<string, string>; // inputId -> value
  'character-note': Record<string, string>; // inputId -> value
};

export type QuestionType = 'text' | 'checkbox' | 'select';

export interface Question {
  inputId: string;
  text: string;
  script: string;
  type: QuestionType;
  defaultValue: string | boolean;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  showScript: string;
}

export interface ScenarioExportData {
  descriptionScript: string;
  firstMessageScript: string;
  scenarioScript: string;
  personalityScript: string;
  characterNoteScript: string;
  questions: Question[];
  layout: string[][];
  version: string;
}

export interface ScenarioCreateData extends ScenarioExportData {
  name: string;
  description: string;
  firstMessage: string;
  scenario: string;
  personality: string;
  characterNote: string;
  activeTab: TabId;
  scriptInputValues: ScriptInputValues;
  worldName?: string;
}

export interface FullExportData {
  name?: string;
  description?: string;
  first_mes?: string;
  scenario?: string;
  personality?: string;
  creatorcomment?: string;
  tags?: string[];
  avatar?: string;
  data: {
    name: string;
    description: string;
    first_mes: string;
    scenario: string;
    personality: string;
    character_book?: { entries: any[]; name: string };
    creator: string;
    creator_notes: string;
    tags: string[];
    character_version?: string;
    avatar?: string;
    extensions?: {
      depth_prompt?: {
        prompt: string;
        depth: number;
        role: string;
      };
      world?: string;
    };
  };
  scenario_creator?: ScenarioExportData;
}

export const STORAGE_KEY = 'scenario_creator_data';

export function createEmptyScenarioCreateData(): ScenarioCreateData {
  return {
    name: '',
    description: '',
    descriptionScript: '',
    firstMessage: '',
    firstMessageScript: '',
    scenario: '',
    scenarioScript: '',
    personality: '',
    personalityScript: '',
    characterNote: '',
    characterNoteScript: '',
    questions: [],
    layout: [[]],
    activeTab: 'description',
    scriptInputValues: {
      question: {},
      description: {},
      'first-message': {},
      scenario: {},
      personality: {},
      'character-note': {},
    },
    version: extensionVersion,
    worldName: undefined,
  };
}

export function createEmptyScenarioExportData(): ScenarioExportData {
  return {
    ...createEmptyScenarioCreateData(),
  };
}

interface VersionUpgrade {
  from: string;
  to: string;
  createCallback: (data: ScenarioCreateData) => void;
  exportCallback: (data: ScenarioExportData) => void;
}

const versionUpgrades: VersionUpgrade[] = [
  {
    from: '0.2.0',
    to: '0.2.1',
    createCallback: (data: ScenarioCreateData) => {
      // Add personality fields if they don't exist
      if (!data.hasOwnProperty('personality')) {
        data.personality = '';
      }
      if (!data.hasOwnProperty('personalityScript')) {
        data.personalityScript = '';
      }

      // Add scenario fields if they don't exist
      if (!data.hasOwnProperty('scenario')) {
        data.scenario = '';
      }
      if (!data.hasOwnProperty('scenarioScript')) {
        data.scenarioScript = '';
      }

      // Add character note fields if they don't exist
      if (!data.hasOwnProperty('characterNote')) {
        data.characterNote = '';
      }
      if (!data.hasOwnProperty('characterNoteScript')) {
        data.characterNoteScript = '';
      }

      data.version = '0.2.1';
    },
    exportCallback: (data: ScenarioExportData) => {
      // Add scenario fields if they don't exist
      if (!data.hasOwnProperty('scenarioScript')) {
        data.scenarioScript = '';
      }

      // Add personality fields if they don't exist
      if (!data.hasOwnProperty('personalityScript')) {
        data.personalityScript = '';
      }

      // Add character note fields if they don't exist
      if (!data.hasOwnProperty('characterNoteScript')) {
        data.characterNoteScript = '';
      }

      data.version = '0.2.1';
    },
  },
  {
    from: '0.2.1',
    to: '0.3.0',
    createCallback: (data: ScenarioCreateData) => {
      data.version = '0.3.0';
    },
    exportCallback: (data: ScenarioExportData) => {
      data.version = '0.3.0';
    },
  },
  {
    from: '0.3.0',
    to: '0.3.1',
    createCallback: (data: ScenarioCreateData) => {
      data.version = '0.3.1';
    },
    exportCallback: (data: ScenarioExportData) => {
      data.version = '0.3.1';
    },
  },
  {
    from: '0.3.1',
    to: '0.3.2',
    createCallback: (data: ScenarioCreateData) => {
      data.version = '0.3.2';
    },
    exportCallback: (data: ScenarioExportData) => {
      data.version = '0.3.2';
    },
  },
  {
    from: '0.3.2',
    to: '0.3.3',
    createCallback: (data: ScenarioCreateData) => {
      data.version = '0.3.3';
    },
    exportCallback: (data: ScenarioExportData) => {
      data.version = '0.3.3';
    },
  },
  {
    from: '0.3.3',
    to: '0.3.4',
    createCallback: (data: ScenarioCreateData) => {
      // Add showScript to questions if it doesn't exist
      data.questions.forEach((question) => {
        if (!question.showScript) {
          question.showScript = '';
        }
      });
      data.version = '0.3.4';
    },
    exportCallback: (data: ScenarioExportData) => {
      // Add showScript to questions if it doesn't exist
      data.questions.forEach((question) => {
        if (!question.showScript) {
          question.showScript = '';
        }
      });
      data.version = '0.3.4';
    },
  },
  {
    from: '0.3.4',
    to: '0.3.5',
    createCallback: (data: ScenarioCreateData) => {
      data.version = '0.3.5';
    },
    exportCallback: (data: ScenarioExportData) => {
      data.version = '0.3.5';
    },
  },
  {
    from: '0.3.5',
    to: '0.4.0',
    createCallback: (data: ScenarioCreateData) => {
      // Add scriptInputValues to data if it doesn't exist
      if (!data.scriptInputValues) {
        data.scriptInputValues = {
          question: {},
          description: {},
          'first-message': {},
          scenario: {},
          personality: {},
          'character-note': {},
        };
      }
      if (!data.scriptInputValues.question) {
        data.scriptInputValues.question = {};
      }
      if (!data.scriptInputValues.description) {
        data.scriptInputValues.description = {};
      }
      if (!data.scriptInputValues['first-message']) {
        data.scriptInputValues['first-message'] = {};
      }
      if (!data.scriptInputValues.scenario) {
        data.scriptInputValues.scenario = {};
      }
      if (!data.scriptInputValues.personality) {
        data.scriptInputValues.personality = {};
      }
      data.version = '0.4.0';
    },
    exportCallback: (data: ScenarioExportData) => {
      data.version = '0.4.0';
    },
  },
  {
    from: '0.4.0',
    to: '0.4.1',
    createCallback: (data: ScenarioCreateData) => {
      data.version = '0.4.1';
    },
    exportCallback: (data: ScenarioExportData) => {
      data.version = '0.4.1';
    },
  },
  {
    from: '0.4.1',
    to: '0.4.2',
    createCallback: (data: ScenarioCreateData) => {
      data.version = '0.4.2';
    },
    exportCallback: (data: ScenarioExportData) => {
      data.version = '0.4.2';
    },
  },
  {
    from: '0.4.2',
    to: '0.4.3',
    createCallback: (data: ScenarioCreateData) => {
      // Add name field
      if (!data.hasOwnProperty('name')) {
        data.name = '';
      }
      data.version = '0.4.3';
    },
    exportCallback: (data: ScenarioExportData) => {
      data.version = '0.4.3';
    },
  }
];

/**
 * Validates and creates a deep copy of the input data object, ensuring version compatibility.
 * @param data - The input data object to be processed
 * @throws throws an error if version is missing
 */
export function upgradeOrDowngradeData<T extends ScenarioCreateData | ScenarioExportData>(
  data: T,
  type: 'create' | 'export',
): T {
  const newData = JSON.parse(JSON.stringify(data));
  if (!newData.version) {
    throw new Error('No version found in data');
  }

  // Find and apply all applicable upgrades
  let upgraded = false;
  do {
    upgraded = false;
    for (const upgrade of versionUpgrades) {
      if (upgrade.from.includes(newData.version)) {
        if (type === 'create') {
          upgrade.createCallback(newData);
        } else {
          upgrade.exportCallback(newData);
        }
        upgraded = true;
        break; // Only apply one upgrade at a time
      }
    }
  } while (upgraded); // Keep upgrading until no more upgrades are applicable

  // If version is still not current after upgrades, it must be newer
  if (newData.version !== extensionVersion) {
    throw new Error(`Data version ${newData.version} is not compatible with extension version ${extensionVersion}`);
  }

  return newData;
}
