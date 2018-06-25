// @flow

import {chain} from './index';

describe('primitives', () => {
  it('correctly maps', () => {
    const op = chain().map((x) => x + 1);
    expect(op.run([1, 2, 3, 4])).toEqual([2, 3, 4, 5]);
  });

  it('correctly stateful maps', () => {
    const op = chain().statefulMap(
      () => 0,
      (accum, x) => [accum + 1, x + accum],
    );
    expect(op.run([1, 2, 3, 4])).toEqual([1, 3, 5, 7]);

    // run again to make sure the initial state is correctly applied between runs
    expect(op.run([1, 2, 3, 4])).toEqual([1, 3, 5, 7]);
  });

  it('correctly takes', () => {
    const op = chain().take(2);
    expect(op.run([1, 2, 3, 4])).toEqual([1, 2]);
  });

  it('correctly drops', () => {
    const op = chain().drop(2);
    expect(op.run([1, 2, 3, 4])).toEqual([3, 4]);
  });

  it('correctly flatMaps', () => {
    const op = chain().flatMap((x) => [x, x + 1]);
    expect(op.run([1, 2, 3, 4])).toEqual([1, 2, 2, 3, 3, 4, 4, 5]);
  });

  it('correctly filters', () => {
    const op = chain().filter((x) => x > 2);
    expect(op.run([1, 2, 3, 4])).toEqual([3, 4]);
  });
});

describe('chaining works', () => {
  it('supports chaining', () => {
    const op = chain()
      .filter((x) => x > 2)
      .map((x) => x + 1)
      .flatMap((x) => [x, x]);
    expect(op.run([1, 2, 3, 4])).toEqual([4, 4, 5, 5]);
  });

  it('returns the same result as a native implementation', () => {
    const inputArray = [1, 2, 3, 4, 5, 6, 7, 8];
    const native = inputArray
      .filter((x) => x > 2)
      .map((x) => x + 1)
      .filter((x) => x > 4)
      .reduce((acc, x) => acc.concat([x, x]), []);
    const chainOfAction = chain()
      .filter((x) => x > 2)
      .map((x) => x + 1)
      .filter((x) => x > 4)
      .flatMap((x) => [x, x]);
    expect(chainOfAction.run(inputArray)).toEqual(native);
  });
});

describe('optimization works', () => {
  it('reduces chain of actions into a single FlatMap', () => {
    const chainOfAction = chain()
      .filter((x) => x > 2)
      .map((x) => x + 1)
      .filter((x) => x > 4)
      .flatMap((x) => [x, x])
      .optimize();
    expect(chainOfAction.debugPrint()).toBe('FlatMap');
  });

  it('produces the correct result', () => {
    const op = chain()
      .filter((x) => x > 2)
      .map((x) => x + 1)
      .flatMap((x) => [x, x]);
    expect(op.optimize().run([1, 2, 3, 4])).toEqual(op.run([1, 2, 3, 4]));
  });
});
