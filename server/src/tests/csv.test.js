import { csvField } from '../services/csv.js';

test('CSV quotes embedded separators and neutralizes formulas, including whitespace prefixes', () => {
  expect(csvField('a,"b"\nc')).toBe('"a,""b""\nc"');
  for (const text of ['=cmd', '+cmd', '-cmd', '@cmd', ' \t=cmd']) expect(csvField(text).startsWith("'")).toBe(true);
  expect(csvField('Lunch')).toBe('Lunch');
});
