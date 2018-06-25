# flow-sequence

[![CircleCI](https://circleci.com/gh/agrafix/flow-sequence.svg?style=svg)](https://circleci.com/gh/agrafix/flow-sequence)

An (experimental) attempt to allow chaining operations on `Array` without traversing the array
multiple times. In other words: A chain of actions on an array should always be `O(n)` where `n` is
the number of elements in the array.

In the given example all element should only be traversed once:

```javascript
import {chain} from 'flow-sequence';

const op = chain()
  .filter((x) => x > 2)
  .map((x) => x + 1)
  .filter((x) => x > 4)
  .flatMap((x) => [x, x])
  .optimize();

console.log(op.run[(1, 2, 3, 4, 5)]);
```

## Benchmarks

```
10 elements, no early failing: naive chaining x 337,465 ops/sec ±0.59% (91 runs sampled)
10 elements, no early failing: flow sequence chaining x 1,142,422 ops/sec ±2.46% (87 runs sampled)
100 elements, no early failing: naive chaining x 24,835 ops/sec ±1.41% (83 runs sampled)
100 elements, no early failing: flow sequence chaining x 132,714 ops/sec ±0.80% (86 runs sampled)
10000 elements, no early failing: naive chaining x 7.71 ops/sec ±1.36% (23 runs sampled)
10000 elements, no early failing: flow sequence chaining x 1,345 ops/sec ±0.77% (86 runs sampled)
10000 elements, early failing: naive chaining x 7,931 ops/sec ±1.40% (86 runs sampled)
10000 elements, early failing: flow sequence chaining x 5,594 ops/sec ±1.46% (85 runs sampled)
10000 elements, midway failing: naive chaining x 2,019 ops/sec ±1.09% (88 runs sampled)
10000 elements, midway failing: flow sequence chaining x 4,608 ops/sec ±1.29% (86 runs sampled)
```
