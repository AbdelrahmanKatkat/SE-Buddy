/* SE-Buddy content: regions, topics and challenges. Pure data, no DOM access. */
(function (SEB) {
  'use strict';

  // Map regions. `x`/`y` are percentages inside the map container.
  const regions = [
    { id: 1, name: 'Foundations of Computing', short: 'Foundations of Computing', icon: '🌲', x: 17, y: 46, hue: 142 },
    { id: 2, name: 'Programming & Data Structures', short: 'Programming & Data Structures', icon: '🏰', x: 38, y: 17, hue: 38 },
    { id: 3, name: 'System Design & Architecture', short: 'System Design & Architecture', icon: '🏙️', x: 67, y: 17, hue: 205 },
    { id: 4, name: 'Databases & Storage', short: 'Databases & Storage', icon: '🔮', x: 83, y: 46, hue: 265 },
    { id: 5, name: 'DevOps & Cloud', short: 'DevOps & Cloud', icon: '🌋', x: 78, y: 80, hue: 18 },
    { id: 6, name: 'Testing & Quality', short: 'Testing & Quality', icon: '🏔️', x: 47, y: 82, hue: 195 },
    { id: 7, name: 'Security & Best Practices', short: 'Security & Best Practices', icon: '🛡️', x: 18, y: 80, hue: 350 }
  ];

  // Topics (n = display number used in challenge numbers such as "3.1").
  const topics = [
    { id: 'foundations', n: 1, region: 1, name: 'Foundations', icon: '🧠', desc: 'Bits, complexity, the web and version control: the vocabulary every engineer shares.' },
    { id: 'programming', n: 2, region: 2, name: 'Programming', icon: '</>', desc: 'Write and debug small functions. Variables, loops, strings and dictionaries.' },
    { id: 'data-structures', n: 3, region: 2, name: 'Data Structures', icon: '🧱', desc: 'Stacks, hash maps and intervals: pick the structure that makes the problem easy.' },
    { id: 'algorithms', n: 4, region: 2, name: 'Algorithms', icon: '🕸️', desc: 'Searching, dynamic programming and merging: think about time and space cost.' },
    { id: 'system-design', n: 5, region: 3, name: 'System Design', icon: '🧩', desc: 'Caching, load balancing, queues and the trade-offs of distributed systems.' },
    { id: 'databases', n: 6, region: 4, name: 'Databases', icon: '🗄️', desc: 'SQL, indexes, transactions and joins.' },
    { id: 'devops', n: 7, region: 5, name: 'DevOps', icon: '♾️', desc: 'CI/CD, containers, deployments and infrastructure as code.' },
    { id: 'testing', n: 8, region: 6, name: 'Testing', icon: '🧪', desc: 'Unit tests, test doubles, TDD and keeping suites reliable.' },
    { id: 'security', n: 9, region: 7, name: 'Security', icon: '🔐', desc: 'Injection, password storage, XSS and least privilege.' }
  ];

  const quiz = (id, topic, level, title, q, options, answer, explain, hint, xp) => ({
    id, topic, level, kind: 'quiz', type: 'Quick Quiz', title, xp: xp || 20,
    description: q, options, answer, explain, hint
  });

  const code = (o) => Object.assign({ kind: 'code', xp: 50 }, o);

  const challenges = [
    /* ---------- 1 Foundations ---------- */
    quiz('found-1', 'foundations', 1, 'Counting with Bits', 'How many different values can 8 bits represent?',
      ['64', '128', '256', '512'], 2, 'Each bit doubles the number of combinations, so 8 bits give 2^8 = 256 values (0-255).',
      'Each additional bit doubles the count. Think 2 to the power of something.'),
    quiz('found-2', 'foundations', 2, 'Hash Map Speed', 'What is the average-case time complexity of looking up a key in a hash map?',
      ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 0, 'A hash function maps the key straight to a bucket, so the average lookup does not depend on map size.',
      'The hash function jumps directly to where the key should live.'),
    quiz('found-3', 'foundations', 3, 'HTTP Status Codes', 'Which HTTP status code means the requested resource was not found?',
      ['200', '301', '404', '500'], 2, '404 Not Found. 200 is success, 301 a permanent redirect and 500 a server error.',
      'It is in the 4xx range: errors caused by the client request.'),
    quiz('found-4', 'foundations', 4, 'Saving Work in Git', 'Which git command records the staged changes as a new snapshot in history?',
      ['git add', 'git commit', 'git push', 'git fetch'], 1, '`git add` stages changes, `git commit` records them locally, `git push` uploads commits.',
      'Staging is not the same as saving a snapshot. Which command creates the commit object?'),

    /* ---------- 2 Programming ---------- */
    code({
      id: 'prog-1', topic: 'programming', level: 1, type: 'Complete the Function', title: 'Say Hello', xp: 30,
      description: 'Complete greet so it returns the string "Hello, <name>!" for the given name.',
      fn: 'greet',
      starter: 'def greet(name: str) -> str:\n    # Return "Hello, <name>!"\n    pass\n',
      tests: [{ args: ['Ada'], expected: 'Hello, Ada!' }, { args: ['World'], expected: 'Hello, World!' }],
      hidden: [{ args: [''], expected: 'Hello, !' }],
      hints: ['Functions return a value with the return keyword. Right now it returns None.', 'Build the string with an f-string: f"...{name}..."', 'return f"Hello, {name}!"'],
      solution: 'def greet(name: str) -> str:\n    return f"Hello, {name}!"\n'
    }),
    code({
      id: 'prog-2', topic: 'programming', level: 2, type: 'Complete the Function', title: 'Even Sum', xp: 30,
      description: 'Return the sum of all even numbers in the list. An empty list sums to 0.',
      fn: 'sum_even',
      starter: 'def sum_even(nums: list) -> int:\n    total = 0\n    # add the even numbers to total\n    return total\n',
      tests: [{ args: [[1, 2, 3, 4]], expected: 6 }, { args: [[]], expected: 0 }, { args: [[7, 9]], expected: 0 }],
      hidden: [{ args: [[-2, 3, 4]], expected: 2 }],
      hints: ['Loop over nums and look at one number at a time.', 'A number n is even when n % 2 == 0.', 'for n in nums:\n    if n % 2 == 0:\n        total += n'],
      solution: 'def sum_even(nums: list) -> int:\n    total = 0\n    for n in nums:\n        if n % 2 == 0:\n            total += n\n    return total\n'
    }),
    code({
      id: 'prog-3', topic: 'programming', level: 3, type: 'Fix the Bug', title: 'Fix the Bug', xp: 50,
      description: 'The function below is supposed to find the first non-repeating character in a string. It has a bug. Fix it so that it works correctly and passes all test cases.',
      fn: 'first_non_repeating',
      starter: 'def first_non_repeating(s: str) -> str:\n    count = {}\n    for c in s:\n        count[c] = count.get(c, 0) + 1\n    for c in s:\n        if count[c] > 1:   # <- bug here\n            return c\n    return None\n',
      tests: [{ args: ['leetcode'], expected: 'l' }, { args: ['aabbcc'], expected: null }, { args: ['aab'], expected: 'b' }],
      hidden: [{ args: ['swiss'], expected: 'w' }, { args: ['z'], expected: 'z' }, { args: [''], expected: null }],
      hints: ['Think about what condition should identify a non-repeating character. Should it be > 1 or == 1?', 'Look at the logic in the second loop.', 'Try changing the condition to count[c] == 1 and run the tests again.'],
      solution: 'def first_non_repeating(s: str) -> str:\n    count = {}\n    for c in s:\n        count[c] = count.get(c, 0) + 1\n    for c in s:\n        if count[c] == 1:\n            return c\n    return None\n'
    }),
    code({
      id: 'prog-4', topic: 'programming', level: 4, type: 'Implement', title: 'FizzBuzz', xp: 40,
      description: 'Return a list of strings for 1..n. Multiples of 3 become "Fizz", multiples of 5 become "Buzz", multiples of both become "FizzBuzz". Every other number is its own value as a string.',
      fn: 'fizzbuzz',
      starter: 'def fizzbuzz(n: int) -> list:\n    result = []\n    # fill result for 1..n\n    return result\n',
      tests: [{ args: [5], expected: ['1', '2', 'Fizz', '4', 'Buzz'] },
        { args: [15], expected: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'] }],
      hidden: [{ args: [0], expected: [] }, { args: [3], expected: ['1', '2', 'Fizz'] }],
      hints: ['range(1, n + 1) gives 1..n inclusive.', 'Check the "both" case (divisible by 15) first, or you will never reach it.', 'if i % 15 == 0: ... elif i % 3 == 0: ... elif i % 5 == 0: ... else: str(i)'],
      solution: 'def fizzbuzz(n: int) -> list:\n    result = []\n    for i in range(1, n + 1):\n        if i % 15 == 0:\n            result.append("FizzBuzz")\n        elif i % 3 == 0:\n            result.append("Fizz")\n        elif i % 5 == 0:\n            result.append("Buzz")\n        else:\n            result.append(str(i))\n    return result\n'
    }),
    code({
      id: 'prog-5', topic: 'programming', level: 5, type: 'Implement', title: 'Palindrome Check', xp: 50,
      description: 'Return True if the string reads the same forwards and backwards, ignoring case and any character that is not a letter or digit.',
      fn: 'is_palindrome',
      starter: 'def is_palindrome(s: str) -> bool:\n    pass\n',
      tests: [{ args: ['A man, a plan, a canal: Panama'], expected: true }, { args: ['hello'], expected: false }, { args: [''], expected: true }],
      hidden: [{ args: ["No 'x' in Nixon"], expected: true }, { args: ['ab'], expected: false }],
      hints: ['First build a cleaned version of the string containing only lowercase letters and digits.', 'str.isalnum() and str.lower() help here.', 'cleaned = [c.lower() for c in s if c.isalnum()]; compare it with its reverse cleaned[::-1].'],
      solution: 'def is_palindrome(s: str) -> bool:\n    cleaned = [c.lower() for c in s if c.isalnum()]\n    return cleaned == cleaned[::-1]\n'
    }),
    code({
      id: 'prog-6', topic: 'programming', level: 6, type: 'Implement', title: 'Word Count', xp: 50,
      description: 'Return a dictionary mapping each word to how many times it appears. Words are separated by whitespace and compared case-insensitively (use lowercase keys).',
      fn: 'word_count',
      starter: 'def word_count(text: str) -> dict:\n    counts = {}\n    # your code here\n    return counts\n',
      tests: [{ args: ['the cat and the hat'], expected: { the: 2, cat: 1, and: 1, hat: 1 } }, { args: ['Hello hello'], expected: { hello: 2 } }, { args: [''], expected: {} }],
      hidden: [{ args: ['a b  a'], expected: { a: 2, b: 1 } }],
      hints: ['str.split() with no arguments splits on any run of whitespace.', 'Lowercase each word before counting it.', 'counts[w] = counts.get(w, 0) + 1'],
      solution: 'def word_count(text: str) -> dict:\n    counts = {}\n    for w in text.lower().split():\n        counts[w] = counts.get(w, 0) + 1\n    return counts\n'
    }),

    /* ---------- 3 Data Structures ---------- */
    code({
      id: 'ds-1', topic: 'data-structures', level: 1, type: 'Implement', title: 'Balanced Brackets', xp: 60,
      description: 'Return True if every opening bracket in s ( [ { has a matching closing bracket in the correct order. Any other characters can be ignored.',
      fn: 'is_balanced',
      starter: 'def is_balanced(s: str) -> bool:\n    stack = []\n    pairs = {")": "(", "]": "[", "}": "{"}\n    # your code here\n    return True\n',
      tests: [{ args: ['()[]{}'], expected: true }, { args: ['(]'], expected: false }, { args: ['((('], expected: false }, { args: ['{[()]}'], expected: true }],
      hidden: [{ args: [''], expected: true }, { args: [']'], expected: false }],
      hints: ['A stack (list with append/pop) is the natural fit: last opened, first closed.', 'On a closing bracket, the stack must be non-empty and its top must be the matching opener.', 'At the end the stack must be empty, otherwise some brackets were never closed.'],
      solution: 'def is_balanced(s: str) -> bool:\n    stack = []\n    pairs = {")": "(", "]": "[", "}": "{"}\n    for c in s:\n        if c in "([{":\n            stack.append(c)\n        elif c in pairs:\n            if not stack or stack.pop() != pairs[c]:\n                return False\n    return not stack\n'
    }),
    code({
      id: 'ds-2', topic: 'data-structures', level: 2, type: 'Implement', title: 'Two Sum', xp: 60,
      description: 'Return the indices [i, j] (i < j) of the two numbers that add up to target. Return [] if no pair exists.',
      fn: 'two_sum',
      starter: 'def two_sum(nums: list, target: int) -> list:\n    # try to do it in one pass\n    return []\n',
      tests: [{ args: [[2, 7, 11, 15], 9], expected: [0, 1] }, { args: [[3, 2, 4], 6], expected: [1, 2] }, { args: [[3, 3], 6], expected: [0, 1] }],
      hidden: [{ args: [[1, 2, 3], 7], expected: [] }],
      hints: ['Brute force checks every pair: O(n^2). A dictionary can make it O(n).', 'Store value -> index for numbers you have already seen.', 'For each number, look up target - number in the dictionary before adding the number itself.'],
      solution: 'def two_sum(nums: list, target: int) -> list:\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return []\n'
    }),
    code({
      id: 'ds-3', topic: 'data-structures', level: 3, type: 'Implement', title: 'Top K Frequent', xp: 70,
      description: 'Return the k most frequent numbers. Order by frequency (highest first); break ties by the smaller number first.',
      fn: 'top_k_frequent',
      starter: 'def top_k_frequent(nums: list, k: int) -> list:\n    counts = {}\n    # count, then sort\n    return []\n',
      tests: [{ args: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2] }, { args: [[4, 4, 5, 5, 6], 2], expected: [4, 5] }, { args: [[1], 1], expected: [1] }],
      hidden: [{ args: [[3, 3, 2, 2, 1], 3], expected: [2, 3, 1] }],
      hints: ['Count occurrences with a dictionary first.', 'sorted() accepts a key function. A tuple key sorts by several fields.', 'sorted(counts, key=lambda n: (-counts[n], n))[:k]'],
      solution: 'def top_k_frequent(nums: list, k: int) -> list:\n    counts = {}\n    for n in nums:\n        counts[n] = counts.get(n, 0) + 1\n    return sorted(counts, key=lambda n: (-counts[n], n))[:k]\n'
    }),
    code({
      id: 'ds-4', topic: 'data-structures', level: 4, type: 'Implement', title: 'Merge Intervals', xp: 80,
      description: 'Given a list of [start, end] intervals, merge all overlapping (or touching) intervals and return the result sorted by start.',
      fn: 'merge_intervals',
      starter: 'def merge_intervals(intervals: list) -> list:\n    return intervals\n',
      tests: [{ args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] }, { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] }, { args: [[]], expected: [] }],
      hidden: [{ args: [[[5, 6], [1, 2], [2, 3]]], expected: [[1, 3], [5, 6]] }],
      hints: ['Sort the intervals by start first, so overlaps are always neighbours.', 'Keep a result list; compare each interval with the last merged one.', 'If start <= merged[-1][1], extend with max(merged[-1][1], end); otherwise append a new interval.'],
      solution: 'def merge_intervals(intervals: list) -> list:\n    merged = []\n    for start, end in sorted(intervals):\n        if merged and start <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], end)\n        else:\n            merged.append([start, end])\n    return merged\n'
    }),
    code({
      id: 'ds-5', topic: 'data-structures', level: 5, type: 'Implement', title: 'Anagram Groups', xp: 80,
      description: 'Return how many groups of anagrams the list of words contains. "eat", "tea" and "ate" are one group.',
      fn: 'count_anagram_groups',
      starter: 'def count_anagram_groups(words: list) -> int:\n    return 0\n',
      tests: [{ args: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']], expected: 3 }, { args: [['a']], expected: 1 }, { args: [['']], expected: 1 }],
      hidden: [{ args: [[]], expected: 0 }, { args: [['ab', 'ba', 'abc']], expected: 2 }],
      hints: ['Two words are anagrams when their sorted letters are identical.', 'That sorted string can be a key: anagrams collide on the same key.', 'len({"".join(sorted(w)) for w in words})'],
      solution: 'def count_anagram_groups(words: list) -> int:\n    return len({"".join(sorted(w)) for w in words})\n'
    }),

    /* ---------- 4 Algorithms ---------- */
    code({
      id: 'algo-1', topic: 'algorithms', level: 1, type: 'Implement', title: 'Binary Search', xp: 60,
      description: 'Given a sorted list and a target, return the index of the target or -1 if it is absent. Use O(log n) comparisons.',
      fn: 'binary_search',
      starter: 'def binary_search(arr: list, target: int) -> int:\n    lo, hi = 0, len(arr) - 1\n    # shrink the window until found\n    return -1\n',
      tests: [{ args: [[1, 3, 5, 7, 9], 7], expected: 3 }, { args: [[1, 3, 5], 4], expected: -1 }, { args: [[], 1], expected: -1 }, { args: [[2], 2], expected: 0 }],
      hidden: [{ args: [[1, 2, 3, 4, 5, 6], 1], expected: 0 }, { args: [[1, 2, 3, 4, 5, 6], 6], expected: 5 }],
      hints: ['Look at the middle element: mid = (lo + hi) // 2.', 'If arr[mid] is smaller than target, the answer is to the right: lo = mid + 1.', 'Loop while lo <= hi so a single remaining element is still checked.'],
      solution: 'def binary_search(arr: list, target: int) -> int:\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if arr[mid] == target:\n            return mid\n        if arr[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1\n'
    }),
    code({
      id: 'algo-2', topic: 'algorithms', level: 2, type: 'Implement', title: 'Fibonacci', xp: 60,
      description: 'Return the n-th Fibonacci number (0, 1, 1, 2, 3, 5, ...) with fib(0) = 0 and fib(1) = 1. It must be fast enough for n = 30.',
      fn: 'fib',
      starter: 'def fib(n: int) -> int:\n    return 0\n',
      tests: [{ args: [0], expected: 0 }, { args: [1], expected: 1 }, { args: [10], expected: 55 }, { args: [20], expected: 6765 }],
      hidden: [{ args: [30], expected: 832040 }],
      hints: ['Plain recursion recomputes the same values exponentially many times.', 'You only ever need the previous two values.', 'a, b = b, a + b inside a loop that runs n times.'],
      solution: 'def fib(n: int) -> int:\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n'
    }),
    code({
      id: 'algo-3', topic: 'algorithms', level: 3, type: 'Implement', title: 'Climbing Stairs', xp: 70,
      description: 'You can climb 1 or 2 steps at a time. Return the number of distinct ways to reach step n.',
      fn: 'climb_stairs',
      starter: 'def climb_stairs(n: int) -> int:\n    return 0\n',
      tests: [{ args: [1], expected: 1 }, { args: [2], expected: 2 }, { args: [3], expected: 3 }, { args: [5], expected: 8 }],
      hidden: [{ args: [30], expected: 1346269 }],
      hints: ['To reach step n, your last move came from step n-1 or n-2.', 'So ways(n) = ways(n-1) + ways(n-2). Does that remind you of something?', 'Start with ways(1) = 1 and ways(2) = 2 and iterate upward.'],
      solution: 'def climb_stairs(n: int) -> int:\n    a, b = 1, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n'
    }),
    code({
      id: 'algo-4', topic: 'algorithms', level: 4, type: 'Implement', title: 'Maximum Subarray', xp: 80,
      description: 'Return the largest sum of any contiguous, non-empty slice of the list.',
      fn: 'max_subarray',
      starter: 'def max_subarray(nums: list) -> int:\n    return 0\n',
      tests: [{ args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 }, { args: [[1]], expected: 1 }, { args: [[-3, -1, -2]], expected: -1 }],
      hidden: [{ args: [[5, 4, -1, 7, 8]], expected: 23 }],
      hints: ['Track the best sum of a subarray ending at the current element.', 'At each element choose: extend the previous run, or start fresh here.', 'current = max(n, current + n); best = max(best, current). Start both from nums[0].'],
      solution: 'def max_subarray(nums: list) -> int:\n    current = best = nums[0]\n    for n in nums[1:]:\n        current = max(n, current + n)\n        best = max(best, current)\n    return best\n'
    }),
    code({
      id: 'algo-5', topic: 'algorithms', level: 5, type: 'Implement', title: 'Merge Sorted Lists', xp: 70,
      description: 'Merge two already-sorted lists into one sorted list without calling sorted() or list.sort().',
      fn: 'merge_sorted',
      starter: 'def merge_sorted(a: list, b: list) -> list:\n    return []\n',
      tests: [{ args: [[1, 3, 5], [2, 4, 6]], expected: [1, 2, 3, 4, 5, 6] }, { args: [[], [1]], expected: [1] }, { args: [[1, 1], [1]], expected: [1, 1, 1] }],
      hidden: [{ args: [[1, 2, 3], [4, 5]], expected: [1, 2, 3, 4, 5] }],
      hints: ['Keep one pointer in each list and always take the smaller front element.', 'When one list runs out, the rest of the other list can be copied over.', 'while i < len(a) and j < len(b): ... then result.extend(a[i:]); result.extend(b[j:])'],
      solution: 'def merge_sorted(a: list, b: list) -> list:\n    result, i, j = [], 0, 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            result.append(a[i])\n            i += 1\n        else:\n            result.append(b[j])\n            j += 1\n    result.extend(a[i:])\n    result.extend(b[j:])\n    return result\n'
    }),

    /* ---------- 5 System Design ---------- */
    quiz('sys-1', 'system-design', 1, 'Write-Through Cache', 'A cache sits in front of a database. Which strategy updates the cache and the database together on every write?',
      ['Write-through', 'Write-around', 'Cache-aside (lazy loading)', 'Time-to-live expiry'], 0, 'Write-through writes to both the cache and the store synchronously, so reads never see stale data at the cost of slower writes.',
      'The name hints that the write goes "through" the cache to the store.', 30),
    quiz('sys-2', 'system-design', 2, 'Spreading the Load', 'Which component distributes incoming requests across several identical servers?',
      ['DNS resolver', 'Load balancer', 'Message queue', 'Content hash'], 1, 'A load balancer routes requests across a pool of servers, improving throughput and availability.',
      'Its job is balancing traffic.', 30),
    quiz('sys-3', 'system-design', 3, 'The CAP Trade-off', 'According to the CAP theorem, during a network partition a distributed store must choose between...',
      ['Speed and cost', 'Consistency and availability', 'Durability and latency', 'Security and scale'], 1, 'When the network partitions you can keep answering (availability) or keep all nodes in agreement (consistency), not both.',
      'The "C" and the "A" of CAP are the two that collide.', 30),
    quiz('sys-4', 'system-design', 4, 'Decoupling Services', 'Which pattern lets a producer hand off work to consumers that may be slow or offline, using durable messages?',
      ['Message queue', 'Reverse proxy', 'Sticky session', 'Cron job'], 0, 'A message queue buffers work between producer and consumer so they scale and fail independently.',
      'Producers and consumers are connected by a buffer of messages.', 30),

    /* ---------- 6 Databases ---------- */
    quiz('db-1', 'databases', 1, 'Filtering Aggregates', 'Which SQL clause filters groups after GROUP BY has been applied?',
      ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'], 1, 'WHERE filters rows before grouping; HAVING filters the aggregated groups.',
      'WHERE runs before grouping, so it cannot see aggregates like COUNT(*).', 30),
    quiz('db-2', 'databases', 2, 'Why Index?', 'What does adding an index to a column mostly do?',
      ['Speeds up lookups on that column but slows down writes', 'Encrypts the column', 'Removes duplicate rows', 'Compresses the table to save space'], 0, 'An index is an extra sorted structure: reads get faster, while every insert and update must also maintain it.',
      'Nothing is free: what does the database now have to maintain on every write?', 30),
    quiz('db-3', 'databases', 3, 'ACID Letters', 'In ACID, what does the "I" stand for?',
      ['Integration', 'Idempotence', 'Isolation', 'Indexing'], 2, 'Isolation means concurrent transactions do not see each other\'s partial work.',
      'It describes how concurrent transactions are kept apart.', 30),
    quiz('db-4', 'databases', 4, 'Keeping Every Row', 'Which join returns all rows from the left table even when there is no match on the right?',
      ['INNER JOIN', 'LEFT JOIN', 'CROSS JOIN', 'SELF JOIN'], 1, 'LEFT JOIN keeps every left row and fills the right-side columns with NULL when nothing matches.',
      'The answer is named after the table whose rows you keep.', 30),

    /* ---------- 7 DevOps ---------- */
    quiz('ops-1', 'devops', 1, 'What is CI?', 'In "CI/CD", what does CI stand for?',
      ['Code Inspection', 'Continuous Integration', 'Container Isolation', 'Cloud Infrastructure'], 1, 'Continuous Integration: merge small changes often and verify each one with an automated build and tests.',
      'Developers integrate their work into a shared branch frequently.', 30),
    quiz('ops-2', 'devops', 2, 'Image vs Container', 'How does a Docker container relate to a Docker image?',
      ['They are the same thing', 'A container is a running instance of an image', 'An image is a running instance of a container', 'A container is a backup of an image'], 1, 'The image is the immutable template; a container is a live process started from it.',
      'Think class versus object.', 30),
    quiz('ops-3', 'devops', 3, 'Safer Releases', 'Which deployment strategy sends a small share of traffic to the new version first, then widens it?',
      ['Big-bang release', 'Canary release', 'Cold standby', 'Blue screen'], 1, 'Canary releases limit the blast radius: watch metrics on a small slice before rolling out fully.',
      'Miners used a certain bird to detect danger early.', 30),
    quiz('ops-4', 'devops', 4, 'Infrastructure as Code', 'Which of these is an Infrastructure-as-Code tool?',
      ['Terraform', 'Photoshop', 'Wireshark', 'Postman'], 0, 'Terraform describes cloud resources in declarative files that can be versioned and reviewed like code.',
      'It "forms" the "terra" of your cloud from configuration files.', 30),

    /* ---------- 8 Testing ---------- */
    quiz('test-1', 'testing', 1, 'Smallest Test', 'Which kind of test verifies a single function or class in isolation?',
      ['Unit test', 'End-to-end test', 'Load test', 'Smoke test'], 0, 'Unit tests are small, fast and isolated, which makes failures easy to localise.',
      'It tests one unit of code.', 30),
    quiz('test-2', 'testing', 2, 'Test Doubles', 'Which test double records how it was called so a test can assert on those calls?',
      ['Stub', 'Dummy', 'Spy / mock', 'Fixture'], 2, 'Spies and mocks capture calls and arguments; stubs only return canned answers.',
      'It "watches" the calls made to it.', 30),
    quiz('test-3', 'testing', 3, 'The TDD Cycle', 'What is the order of the test-driven development cycle?',
      ['Green, Red, Refactor', 'Refactor, Red, Green', 'Red, Green, Refactor', 'Red, Refactor, Green'], 2, 'Write a failing test (red), make it pass (green), then clean up (refactor).',
      'A test must fail first, otherwise you do not know it can detect the problem.', 30),
    quiz('test-4', 'testing', 4, 'Flaky Tests', 'What is a flaky test?',
      ['A test that is slow', 'A test that sometimes passes and sometimes fails without code changes', 'A test with no assertions', 'A test that only runs in production'], 1, 'Flaky tests are non-deterministic (timing, shared state, network), which erodes trust in the suite.',
      'The same code gives different results on different runs.', 30),

    /* ---------- 9 Security ---------- */
    quiz('sec-1', 'security', 1, 'Stopping Injection', 'Which defence is the most reliable against SQL injection?',
      ['Escaping quotes by hand', 'Parameterized queries', 'Hiding error messages', 'Using longer passwords'], 1, 'Parameterized queries keep data and SQL code separate, so input can never change the query structure.',
      'The query structure and the values travel separately.', 30),
    quiz('sec-2', 'security', 2, 'Storing Passwords', 'How should user passwords be stored?',
      ['In plain text, in a protected table', 'Encrypted with a shared secret key', 'Hashed with a slow, salted algorithm such as bcrypt or Argon2', 'Base64 encoded'], 2, 'Slow salted hashes make stolen databases expensive to crack and prevent identical passwords matching.',
      'You never need to read the password back, only verify it.', 30),
    quiz('sec-3', 'security', 3, 'What XSS Does', 'What does a successful cross-site scripting (XSS) attack allow?',
      ['Running attacker script in a victim\'s browser on a trusted site', 'Reading the server\'s source code', 'Crashing the database', 'Guessing weak passwords'], 0, 'XSS injects script into pages other users load, letting it act with their session and privileges.',
      'The "scripting" runs on the victim\'s side.', 30),
    quiz('sec-4', 'security', 4, 'Least Privilege', 'What does the principle of least privilege say?',
      ['Everyone shares one admin account', 'Give each user and service only the access it needs', 'Disable all logging', 'Encrypt only the passwords'], 1, 'Minimal permissions limit the damage when an account or service is compromised.',
      'Grant the smallest set of permissions that still lets the job get done.', 30)
  ];

  const quotes = [
    'Small steps today, big systems tomorrow.',
    'Make it work, make it right, make it fast.',
    'Every expert was once a beginner who kept shipping.',
    'Debugging is twice as hard as writing the code. Be patient.',
    'Simple is better than complex.'
  ];

  // Static sample rivals: a static site has no backend, so the board is illustrative.
  const rivals = [
    { name: 'Grace H.', avatar: '🦊', xp: 9400 },
    { name: 'Linus T.', avatar: '🐧', xp: 7800 },
    { name: 'Margaret H.', avatar: '🚀', xp: 6200 },
    { name: 'Dennis R.', avatar: '🦉', xp: 4100 },
    { name: 'Barbara L.', avatar: '🐢', xp: 2300 },
    { name: 'Ken T.', avatar: '🐙', xp: 900 },
    { name: 'Radia P.', avatar: '🦄', xp: 350 }
  ];

  SEB.data = { regions, topics, challenges, quotes, rivals };
})(window.SEB = window.SEB || {});
