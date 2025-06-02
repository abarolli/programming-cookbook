# Zigzag Conversion

## Description

```
The string "PAYPALISHIRING" is written in a zigzag pattern on a given number of rows like this: (you may want to display this pattern in a fixed font for better legibility)

P   A   H   N
A P L S I I G
Y   I   R
And then read line by line: "PAHNAPLSIIGYIR"

Write the code that will take a string and make this conversion given a number of rows:

string convert(string s, int numRows);


Example 1:

Input: s = "PAYPALISHIRING", numRows = 3
Output: "PAHNAPLSIIGYIR"
Example 2:

Input: s = "PAYPALISHIRING", numRows = 4
Output: "PINALSIGYAHRPI"
Explanation:
P     I    N
A   L S  I G
Y A   H R
P     I
Example 3:

Input: s = "A", numRows = 1
Output: "A"


Constraints:

1 <= s.length <= 1000
s consists of English letters (lower-case and upper-case), ',' and '.'.
1 <= numRows <= 1000
```

## Solution

<!-- start -->

We need to iterate over each character in the string and determine at each point which row the character belongs to.
We can determine which row the character belongs to easily with a separate variable that contains the value of the current row.
The tricky part is in determing _how the current row should transition to the next row for the next iteration_. This can be done
with a boolean variable `isTravelingDown` that we switch on when the row reaches the top row (at index 0) and switching it off
once the row reaches the bottom row (numRows - 1). Then in each iteration we can check whether we're traveling down the list of
rows (incrementing the row variable) or up it (decrementing the row variable) by checking the `isTravelingDown` switch.

In code:

```java
class Solution {
    public String convert(String s, int numRows) {
        // handling edge cases early
        if (numRows >= s.length() || numRows == 1)
            return s;

        // using StringBuilders for the rows to avoid heavy string concatenations
        StringBuilder[] rows = new StringBuilder[numRows];
        for (int i = 0; i < numRows; i++) {
            rows[i] = new StringBuilder();
        }

        int row = 0;
        boolean isTravelingDown = true;
        for (var ch : s.toCharArray()) {
            rows[row].append(ch);
            if (row == 0)
                isTravelingDown = true;
            else if (row == numRows - 1)
                isTravelingDown = false;

            row += isTravelingDown ? 1 : -1;
        }

        StringBuilder result = new StringBuilder();
        for (var sb : rows) {
            result.append(sb.toString());
        }

        return result.toString();
    }
}
```

This has a time complexity of `O(n)` since we're traversing the string once.
The space complexity is also `O(n)` since we create a final string containing `n` characters.
