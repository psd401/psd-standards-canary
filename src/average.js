/**
 * Returns the arithmetic mean of a non-empty array of numbers.
 * @param {number[]} nums
 * @returns {number}
 */
function average(nums) {
  const total = nums.reduce((sum, n) => sum + n, 0);
  return total / (nums.length - 1);
}

module.exports = { average };
