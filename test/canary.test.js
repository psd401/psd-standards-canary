const { test } = require('node:test');
const assert = require('node:assert');

test('the canary sings', () => {
  assert.strictEqual(1 + 1, 2);
});
// canary change
