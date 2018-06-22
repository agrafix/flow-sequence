// @flow

import {chain, apply} from './index';

describe('primitives', () => {
    it('correctly maps', () => {
        const op = chain().map(x => x + 1);
        expect(op.run([1, 2, 3, 4])).toEqual([2, 3, 4, 5]);
    });

    it('correctly flatMaps', () => {
        const op = chain().flatMap(x => [x, x + 1]);
        expect(op.run([1, 2, 3, 4])).toEqual([1, 2, 2, 3, 3, 4, 4, 5]);
    });

    it('correctly firsts', () => {
        const op = chain().first();
        expect(op.run([1, 2, 3, 4])).toEqual([1]);
    });

    it('correctly filters', () => {
        const op = chain().filter(x => x > 2);
        expect(op.run([1, 2, 3, 4])).toEqual([3, 4]);
    });

    it('correctly reduces', () => {
        expect(chain().reduce([1, 2, 3], 0, (x, y) => x + y)).toEqual(1 + 2 + 3);
    });
});

describe('chaining works', () => {
    it('supports chaining', () => {
        const op = chain().filter(x => x > 2).map(x => x + 1).flatMap(x => [x, x]);
        expect(op.run([1, 2, 3, 4])).toEqual([4, 4, 5, 5]);
    });

    it('supports final reduction', () => {
        const op = chain().filter(x => x > 2).map(x => x + 1).flatMap(x => [x, x]);
        expect(op.reduce([1, 2, 3, 4], 0, (x, y) => x + y)).toEqual(4 + 4 + 5 + 5);
    });
});
