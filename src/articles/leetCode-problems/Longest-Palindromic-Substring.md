# Longest Palindromic Substring

## Description

```
Given a string s, return the longest palindromic substring in s.



Example 1:

Input: s = "babad"
Output: "bab"
Explanation: "aba" is also a valid answer.
Example 2:

Input: s = "cbbd"
Output: "bb"


Constraints:

1 <= s.length <= 1000
s consist of only digits and English letters.
```

## Solution

<!-- start -->

The key to understand with palindromes is that there are two different kinds of palindromes: **odd-length** and **even-length**.

An **odd-length** palindrome has, as the name suggests, an odd number of characters whose characters are mirrored symmetrically
about a single center character. An **even-length** palindrome has an even number of characters and the characters are mirrored
exactly about a midpoint _between two characters_.

Ex.

- "aca" and "abcba" are odd-length palindromes and are mirrored symmetrically about the "c" character.
- "aa" and "acca" are even-length palindromes and do not have a center character.

So when finding the longest palindromic substring, both of these possibilities need to be considered. For this, we'll
use what I call the "crawling" traversal.

Two pointers, _first_ and _second_ will start at the same position and will move
forward _sequentially_, not _simultaneously_. These two pointers will always represent the "center" of our palindrome; when
trying to find an odd-length palindrome, the pointers will be directly on top of each other, when trying to find an even-length
palindrome, the pointers will be one off from each other (the _first_ pointer will be one ahead of _second_). At each iteration,
two more pointers will be spawned, a _left_ pointer starting at _second_ and a _right_ pointer starting at _first_. As long as,
the characters at the two pointers are equal, we have a valid palindrome and the left pointer moves left one and right pointer
moves right one. The moment the characters at the left and right pointers are not equal, we no longer have a palindrome and should
break out of the inner loop. Each time we break out of the inner loop, we calculate the substring at that point and if it's longer
than the previous longest substring, we replace it.

In code:

```java
class Solution {
    public String longestPalindrome(String s) {

        String longest = "";
        int first = 0, second = 0;
        while (first < s.length()) {

            int left = second, right = first;
            while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
                left--;
                right++;
            }

            // when calculating current substring, need to add 1 to left since at this
            // point the left pointer is outside of the bounds of the valid palindrome.
            // don't need to do the same to right because the second paramater is exclusive in String.substring.
            String current = s.substring(left + 1, right);
            if (current.length() > longest.length())
                longest = current;

            if (first == second)
                first++;
            else
                second++;
        }

        return longest;
    }
}
```

The time complexity for this solution is `O(n * m)` and a space complexity of `O(m)` with `m` being the
length of the longest substring.
