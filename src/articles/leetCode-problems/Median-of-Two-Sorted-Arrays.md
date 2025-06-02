# Median of Two Sorted Arrays

## Description

```
Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).



Example 1:

Input: nums1 = [1,3], nums2 = [2]
Output: 2.00000
Explanation: merged array = [1,2,3] and median is 2.
Example 2:

Input: nums1 = [1,2], nums2 = [3,4]
Output: 2.50000
Explanation: merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.


Constraints:

nums1.length == m
nums2.length == n
0 <= m <= 1000
0 <= n <= 1000
1 <= m + n <= 2000
-106 <= nums1[i], nums2[i] <= 106
```

## Solution

<!-- start -->

The key to understand in this problem is that the two arrays are _already sorted_. So finding the median of both arrays
will be as easy as merging the two arrays into a single sorted array and then finding the middle number. If there is an even number
of elements in the merged array, then the median will be the average of the two middle elements, otherwise
it'll just be the middle element.

Merging the two arrays into a single sorted array uses the same steps described during the "merge" phase of the [merge sort algorithm](https://en.wikipedia.org/wiki/Merge_sort).

```
1. Compare the leftmost element of each array
2. Add whichever one's smallest to the end of the merge array and move the pointer for that array forward.
3. Repeat step 1. The moment we reach the end of either the first or second array we break from this loop.
4. There is a chance that one array has more elements than the other.
    Add the leftmost element of the array with remaining elements until it has been exhausted.
```

At this point, we have a merged, sorted array. As described before, we either return the average of the two
middle elements if the array is of even length, or just the value of the single middle element if the array
is of odd length.

In code:

```java
class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {

        int[] merged = new int[nums1.length + nums2.length];
        int first = 0, second = 0;
        while (first < nums1.length && second < nums2.length) {
            if (nums1[first] < nums2[second])
                merged[first + second] = nums1[first++];
            else
                merged[first + second] = nums2[second++];
        }

        while (first < nums1.length) {
            merged[first + second] = nums1[first++];
        }

        while (second < nums2.length) {
            merged[first + second] = nums2[second++];
        }

        int mid = (first + second) / 2;
        if ((first + second) % 2 == 0)
            return (merged[mid] + merged[mid - 1]) / 2.0;

        return merged[mid];
    }
}
```
