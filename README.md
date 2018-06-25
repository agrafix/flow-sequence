# flow-sequence

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
  .flatMap((x) => [x, x]);
console.log(op.run[(1, 2, 3, 4, 5)]);
```

## Benchmarks

```
10 elements, no early failing: naive chaining x 339,957 ops/sec ±0.54% (90 runs sampled)
10 elements, no early failing: flow sequence chaining x 902,977 ops/sec ±0.84% (87 runs sampled)
10 elements, no early failing: flow sequence interpreter chaining x 1,189,882 ops/sec ±0.90% (86 runs sampled)
100 elements, no early failing: naive chaining x 26,328 ops/sec ±0.96% (84 runs sampled)
100 elements, no early failing: flow sequence chaining x 95,715 ops/sec ±0.79% (87 runs sampled)
100 elements, no early failing: flow sequence interpreter chaining x 129,276 ops/sec ±0.69% (89 runs sampled)
10000 elements, no early failing: naive chaining x 6.40 ops/sec ±10.04% (19 runs sampled)
10000 elements, no early failing: flow sequence chaining x 915 ops/sec ±1.59% (85 runs sampled)
10000 elements, no early failing: flow sequence interpreter chaining x 1,205 ops/sec ±2.08% (82 runs sampled)
10000 elements, early failing: naive chaining x 7,736 ops/sec ±1.10% (84 runs sampled)
10000 elements, early failing: flow sequence chaining x 1,890 ops/sec ±0.99% (87 runs sampled)
10000 elements, early failing: flow sequence interpreter chaining x 5,328 ops/sec ±1.38% (84 runs sampled)
10000 elements, midway failing: naive chaining x 1,897 ops/sec ±2.12% (84 runs sampled)
10000 elements, midway failing: flow sequence chaining x 1,328 ops/sec ±2.20% (79 runs sampled)
10000 elements, midway failing: flow sequence interpreter chaining x 4,416 ops/sec ±1.23% (86 runs sampled)
```
