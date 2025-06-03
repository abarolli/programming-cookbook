# Reverse Integer

## Description

```
Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.

Assume the environment does not allow you to store 64-bit integers (signed or unsigned).


Example 1:

Input: x = 123
Output: 321
Example 2:

Input: x = -123
Output: -321
Example 3:

Input: x = 120
Output: 21


Constraints:

-231 <= x <= 231 - 1
```

## Solution

<!-- start -->

This problem teaches a fundamental concept in programming; you can perform _array-like_ operations on integers
with very simple math operations involving 10.

### Peek using mod 10

Given any integer, you can "peek" at the last digit by taking the modulus of the integer and 10.

```java
int lastDigit = <anyInteger> % 10;
// Ex.
// 123 % 10 == 3 ; 10 goes into 123 a total of 12 times with 3 left over.
// 6 % 10 == 6 ; 10 goes into 6 a total of 0 times with 6 left over.
// -54 % 10 == -4 ; 10 goes into -54 a total of 5 times with -4 left over
```

Note that `-54 % 10` resulted in -4 being returned... in languages like Java and C, the sign of the dividend (the left-hand operand) is always maintained. The behavior is different in languages like Python that use a more mathematical convention. See the [Python Section](#python-section) for more info.

### Pop by dividing by 10

We can get every number, up to but not including the last digit by performing integer division with respect to 10.

```java
// 123 / 10 == 12
// 6 / 10 == 0
// -54 / 10 == -5
```

Note again that -54 / 10 returned a -5... this is only the case in languages like C or Java where the fractional part is effectively lopped off and the value is truncated towards 0, regardless of whether it is positive or negative.
The behavior is different in languages like Python where something like `-54 // 10 == -6` because python does floor division... the number is rounded down towards negative infinity, regardless of the sign.
So in the case of `-54 // 10`, `54 / 10` is equal to `-5.4` and that gets rounded down to the nearest whole
number towards negative infinity, resulting in `-6`. Again, see the [Python Section](#python-section) for more info.

With the above knowledge, you can do something like this to effectively emmulate a "pop" operation on an integer:

```java
int x = 1234;
x /= 10; // x equals 123 at this point
x /= 10; // x equals 12
x /= 10; // x equals 1
x /= 10; // x equals 0
```

### Add to end by multiplying by 10

To add digit to the end of an integer, we first multiply that integer by 10, then add the digit.

Using this info, we can emulate an add/append operation to add a digit to the end.

```java
int x = 1;
x = x * 10 + 2; // x equals 12 now
x = x * 10 + 3; // x == 123
x = x * 10 + 4; // x == 1234
```

Thankfully this relies on basic math principles and can't be mucked about with by opinionated developers,
so we don't have different versions for different languages.

Now using the knowledge that we can perform array-like operations on integers, this problem becomes simpler, with
the only real constraint to watch out for being, `Assume the environment does not allow you to store 64-bit integers (signed or unsigned).`.
This constraint means we need to at some point preemptively check that we don't exceed these bounds.

```
1. Take the modulus of the input integer with respect to 10 to retreive the last digit
2. Add that digit to the end of the reversed integer by multiplying that integer by 10 then adding the digit.
3. Reduce the input integer by one digit by dividing it by 10.
4. Go back to 1 while the input integer is > 0
```

This is the algorithm in its simplest form, not taking into consideration the boundary constraints. So to make sure the value does not exceed
`2^31 - 1` we must first check that multiplying the current reversed integer by 10 does not exceed `2^31 - 1` and that if it does equal `2^31 - 1`
, then we need to ensure that the last digit is not greater than 7. This is because `2^31 - 1` (or the max positive value that a 32 bit integer can hold) is equal to `2147483647`... so we know that adding that next digit will exceed the max integer. A similar approach holds for negative numbers.
If multiplying the current reversed integer by 10 exceeds `-2^31` or if multiplying by 10 equals `-2^31` and the last digit is less than -8, we know we've exceeded the negative boundary because `-2^31` equals `-2147483648`.

It is critical to perform these checks preemptively in statically typed systems like Java and C because if we add the last digit to the reversed integer, then check if it exceeded the bounds, the number will have already overflowed and, in Java at least, the number will wrap
around to remain within the integer bounds, messing up our whole calculation. So in either of those cases, we return 0 immediately, as requested by
the problem description.

In code:

```java
class Solution {
    public int reverse(int x) {
        int reversed = 0;
        while (x != 0) {
            // peek to get last digit
            int lastDigit = x % 10;

            // before adding the last digit, need to check if performing the operation will exceed the bounds at any point
            if (reversed > Integer.MAX_VALUE / 10 || (reversed == Integer.MAX_VALUE / 10 && lastDigit > 7))
                return 0;
            if (reversed < Integer.MIN_VALUE / 10 || (reversed == Integer.MAX_VALUE / 10 && lastDigit < -8))
                return 0;

            // add the last digit to the end of reversed
            reversed = reversed * 10 + lastDigit;

            // pop the last digit
            x /= 10;
        }
        return reversed;
    }
}
```

This operation has a time complexity `O(m)` with `m` being the number of digits in `x`.

## Python Section

Because the Python team took a mathematical approach to their division and modulus operators, we have to make some slight modifications.

### Peek in Python

To peek at the last digit in Python, my preferred approach is to simply use a divisor with the same sign.

```python
-54 % -10 == -4
```

### Pop in Python

To pop the last digit, we perform division like normal, then convert the value using the `int` initializer.

```python
int(-54 / 10) == -5 # -54 / 10 == -5.4; int chops off the fraction part
```

### Add in Python

Adding a digit to the end is the same in Python as in any other language.

```python
54 * 10 + 1 == 541
-54 * 10 - 1 == -541
```

In code:

```python
class Solution:
    def reverse(self, x: int) -> int:
        # python does not really offer a constant for the max or min value of a traditional 32 bit integer like Java does
        max_int = 2 ** 31 - 1
        min_int = -2 ** 31

        reversed_int = 0
        while (x != 0):

            if (x > 0):
                last_digit = x % 10
            else:
                last_digit = x % -10

            if reversed_int > max_int // 10 or (reversed_int == max_int // 10 and last_digit > 7):
                return 0
            if reversed_int < int(min_int / 10) or (reversed_int == int(min_int / 10) and last_digit < -8):
                return 0

            reversed_int = reversed_int * 10 + last_digit
            x = int(x / 10)

        return reversed_int
```
