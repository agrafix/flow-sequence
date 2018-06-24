# flow-sequence

An (experimental) attempt to allow chaining operations on `Array` without traversing the array
multiple times.

In the given example all element should only be traversed once:

```javascript
const op = chain().filter(x => x > 2).map(x => x + 1).filter(x => x > 4).flatMap(x => [x, x]);
console.log(op.run[1, 2, 3, 4, 5]);
```
