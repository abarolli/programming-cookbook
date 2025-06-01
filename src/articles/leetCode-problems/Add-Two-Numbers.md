# Add Two Numbers

## Description

```
You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.

Example 1:

Input: l1 = [2,4,3], l2 = [5,6,4]
Output: [7,0,8]
Explanation: 342 + 465 = 807.
Example 2:

Input: l1 = [0], l2 = [0]
Output: [0]
Example 3:

Input: l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]
Output: [8,9,9,9,0,0,0,1]


Constraints:

The number of nodes in each linked list is in the range [1, 100].
0 <= Node.val <= 9
It is guaranteed that the list represents a number that does not have leading zeros.
```

## Solution

<!-- start -->

The problem gives two pointers that we will traverse simultaneously. In each iteration, we'll
add the value of the two nodes together, _plus_ a `carryover` value that will hold a value of 1 if
the sum of the previous nodes in the iteration was greater or equal to 10. This will continue so long
as we have nodes to iterate over in both the first and second linked list.

There is a chance that one linked list will have more nodes than the other. So after performing the computation
described above we will also iterate over either the first or second linked list (whichever one still has nodes to iterate over) and add
the left over nodes _plus any potential carryover_ in each iteration. At the end, if the `carryover` is 1, we'll append it to the list.

In code:

```java
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {

        ListNode head = null, tail = null;
        int carryOver = 0;
        while (l1 != null && l2 != null) {
            int sum = l1.val + l2.val + carryOver;
            carryOver = sum / 10;
            ListNode newNode = new ListNode(sum % 10); // need to mod because the sum may be >= 10 and we're only concerned with the single digit
            if (head == null) {
                head = tail = newNode;
            }
            else {
                tail.next = newNode;
                tail = newNode;
            }

            l1 = l1.next;
            l2 = l2.next;
        }

        // no need for an if-statement first... if there are no nodes in l1, nothing happens here anyways
        while (l1 != null) {
            int sum = l1.val + carryOver;
            carryOver = sum / 10;
            tail.next = new ListNode(sum % 10);
            tail = tail.next;
            l1 = l1.next;
        }

        // comment above applies here as well
        while (l2 != null) {
            int sum = l2.val + carryOver;
            carryOver = sum / 10;
            tail.next = new ListNode(sum % 10);
            tail = tail.next;
            l2 = l2.next;
        }

        // there may be a carry over leftover, so we add it to the list
        if (carryOver == 1) {
            tail.next = new ListNode(carryOver);
            tail = tail.next;
        }
        return head;
    }
}
```

This has a time complexity of `O(n + m)` since we must iterate over all of the nodes in each of the
linked lists once. It also has a space complexity of `O(n)` with `n` being the larger of the `n` and `m`,
because we create a new linked list with `n` nodes in it and return it to the caller.
