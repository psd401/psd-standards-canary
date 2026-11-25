const { test } = require('node:test');
const assert = require('node:assert');
const { average } = require('../src/average');

test('average is the arithmetic mean', () => {
  assert.strictEqual(average([1, 2, 3, 4]), 2.5);
  assert.strictEqual(average([5]), 5);
});
