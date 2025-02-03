import { interpolateText } from '../scripts/utils';
import { describe, expect, test } from '@jest/globals';

describe('interpolateText', () => {
  test('should replace variables in template string', () => {
    const template = 'Hello {{name}}!';
    const variables = { name: 'World' };
    expect(interpolateText(template, variables, 'remove')).toBe('Hello World!');
  });

  test('should keep variable syntax when type is variableName and value is empty', () => {
    const template = 'Hello {{name}}!';
    const variables = { name: '' };
    expect(interpolateText(template, variables, 'variableName')).toBe('Hello {{name}}!');
  });

  test('should remove variable when type is remove and value is empty', () => {
    const template = 'Hello {{name}}!';
    const variables = { name: '' };
    expect(interpolateText(template, variables, 'remove')).toBe('Hello !');
  });

  test('should handle recursive interpolation', () => {
    const template = 'Hello {{message}}!';
    const variables = {
      message: 'dear {{name}}',
      name: 'World',
    };
    expect(interpolateText(template, variables, 'remove')).toBe('Hello dear World!');
  });

  test('should handle object with label property', () => {
    const template = 'Selected: {{option}}';
    const variables = {
      option: { label: 'Choice 1', value: 'choice1' },
    };
    expect(interpolateText(template, variables, 'remove')).toBe('Selected: Choice 1');
  });

  test('should handle undefined values', () => {
    const template = 'Hello {{name}}!';
    const variables = {};
    expect(interpolateText(template, variables, 'remove')).toBe('Hello !');
  });

  test('should handle missing values', () => {
    const template = 'Hello {{name}}!';
    const variables = { name: undefined as unknown as string };
    expect(interpolateText(template, variables, 'remove')).toBe('Hello !');
  });

  test('should trim string values', () => {
    const template = 'Hello {{name}}!';
    const variables = { name: '  World  ' };
    expect(interpolateText(template, variables, 'remove')).toBe('Hello World!');
  });

  test('should handle boolean values', () => {
    const template = 'Value is {{flag}}';
    const variables = { flag: true };
    expect(interpolateText(template, variables, 'remove')).toBe('Value is true');
  });

  test('should handle multiple variables', () => {
    const template = '{{greeting}} {{name}}! How is {{location}}?';
    const variables = {
      greeting: 'Hello',
      name: 'World',
      location: 'Earth',
    };
    expect(interpolateText(template, variables, 'remove')).toBe('Hello World! How is Earth?');
  });
});
