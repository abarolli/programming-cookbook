# Two Sum

## Description

```
Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.



Example 1:

Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
Example 2:

Input: nums = [3,2,4], target = 6
Output: [1,2]
Example 3:

Input: nums = [3,3], target = 6
Output: [0,1]


Constraints:

- 2 <= nums.length <= 104
- -109 <= nums[i] <= 109
- -109 <= target <= 109
- Only one valid answer exists.


Follow-up: Can you come up with an algorithm that is less than O(n2) time complexity?
```

## Solution

<!-- start -->

The first approach might be to use brute force, checking every single pair combination in the array.

Consider the example input `nums = [3, 2, 4], target = 6`.
Using the brute force approach, you'd start with a fixed number on the far left side and then check all the other numbers in order.

```
[3, 2, 4]
 ^
start here

1. check 3 and 2. They do not sum up to 6, so move on
2. check 3 and 4. They do not sum up to 6, so move on
3. the end of the array has been reach at this point and we've checked all
    possible combinations involving our fixed number 3, so we move the fixed pointer to 2.

[3, 2, 4]
    ^

4. There's no need to check 2 and 3 because we already did that when 3 was the fixed number
    so we just check 2 against 4. They sum to 6, so we return their indices immediately.
```

In everyone's favorite language, Java, this would be programmed like this:

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {

        for (int i = 0; i < nums.length - 1; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[] {i, j};
                }
            }
        }

        return null;
    }
}
```

`i` is considered the "fixed number". We check it against each consecutive number `j` to find a match,
until the end of the array is reached, then `i` is moved to the next number.

Note that the nested loop variable, `j`, always starts one greater than `i` since, as stated, there's no
need to check the preceding numbers to `j` since they would have already been checked against `j` when
they were in the fixed position.

This solution is suboptimal since it runs in `O(n^2)` (the problem even asks for a better solution in the follow up).

The better solution is to use a hash map to store the values as you encounter them. For each number, we'll calculate
the complement (the other number to add to the current number to sum to target -- the difference between the target and the current number),
and then check if we've encountered that complement before by checking our hash map. If we did encounter it, we return the indices,
otherwise, add the current number to the hash map so we can easily find it in the next iteration.

Now in code:

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {

        HashMap<Integer, Integer> encountered = new HashMap<>();

        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (encountered.containsKey(complement))
                return new int[] {i, encountered.get(complement)};

            encountered.put(nums[i], i);
        }

        return null;
    }
}
```

This has a worst-case time complexity of `O(n)` since we're iterating over the entire input once.
Adding an item to a hash map and looking up an item by its key is `O(1)`.
