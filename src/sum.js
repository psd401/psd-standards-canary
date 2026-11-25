/**
 * Returns the sum of an array of numbers. An empty array sums to 0.
 * @param {number[]} nums
 * @returns {number}
 */
function sum(nums) {
  return nums.reduce((total, n) => total + n, 0);
}

module.exports = { sum };
