# Longest Substring Without Repeating Characters

## Description

```
Given a string s, find the length of the longest substring without duplicate characters.



Example 1:

Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.
Example 2:

Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.
Example 3:

Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3.
Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.


Constraints:

0 <= s.length <= 5 * 104
s consists of English letters, digits, symbols and spaces.
```

## Solution

<!-- start -->

The best approach to this problem is to have two pointers that traverse the string. At every point, we want the letters
within the two pointers to be unique (no repeats). One way to check if there are repeats would be to traverse the entire
length of the string between the two pointers and count the characters one by one. The issue is that this will need to be
done in _each iteration_ to see if we have any repeats at that point... not ideal.

A better approach would be to have a separate container, a Set, to store values as we come across them. Set insertion and
lookup times or both `O(1)` so it's much faster than the `O(n)` lookup described in the array before. At each point, we check if the
character at the right pointer is in the Set of existing characters. If it is, we should move the left pointer up until it is 1 greater
than whatever index houses the first occurrence of the repeat character -- **moving it up any less than that makes no sense since we'll
still have the repeating character within the left and right pointers**. Just before moving the left pointer, we should
check if the current length of the substring is longer than the previous longest (the length of the current substring is right - left).

The entire time we move the left pointer up, we must remove whatever character the left pointer is pointing at from the Set since it will
no longer be within the bounds of the left and right pointer and thus makes no sense to have it in the Set of "existing characters".

At the end of the loop, there's a chance that we never encountered a repeat character, in which case we should check one last time if the
difference between the right and left pointers is greater than the previous longest (which will just be 0 at that point)...

In code:

```java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        Set<Character> encountered = new HashSet<>();
        int longest = 0;
        int left = 0, right = 0;
        while (right < s.length()) {

            char current = s.charAt(right);
            if (encountered.contains(current)) {
                if (right - left > longest)
                    longest = right - left;

                while (s.charAt(left) != current) {
                    encountered.remove(s.charAt(left));
                    left++;
                }
                left++;
            }

            encountered.add(current);
            right++;
        }

        if (right - left > longest)
            longest = right - left;

        return longest;
    }
}
```

This has a time complexity of `O(n)` since we traverse the entire string only once.
The space complexity is `O(1)` since there's no auxiliary space being used.
