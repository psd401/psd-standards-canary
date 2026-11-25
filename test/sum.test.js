const { test } = require('node:test');
const assert = require('node:assert');
const { sum } = require('../src/sum');

test('sum adds every number', () => {
  assert.strictEqual(sum([1, 2, 3]), 6);
});

test('sum of an empty array is 0', () => {
  assert.strictEqual(sum([]), 0);
});
