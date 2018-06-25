// @flow

function idOp<I>(): Node<I, I> {
  return new Map((x) => x);
}

export function chain<I>(): DSL<I, I> {
  return new DSL(idOp());
}

class DSL<I, O> {
  pipe: Node<I, O>;

  constructor(pipe: Node<I, O>) {
    this.pipe = pipe;
  }

  map<R>(map: (element: O) => R): DSL<I, R> {
    return this.merge(new DSL(new Map(map)));
  }

  filter(filter: (element: O) => boolean): DSL<I, O> {
    return this.merge(new DSL(new Filter(filter)));
  }

  flatMap<R>(map: (element: O) => Array<R>): DSL<I, R> {
    return this.merge(new DSL(new FlatMap(map)));
  }

  take(n: number): DSL<I, O> {
    return this.merge(new DSL(new Take(n)));
  }

  drop(n: number): DSL<I, O> {
    return this.merge(new DSL(new Drop(n)));
  }

  merge<R>(otherChain: DSL<O, R>): DSL<I, R> {
    return new DSL(new Combine(this.pipe, otherChain.pipe)).optimize();
  }

  optimize(): DSL<I, O> {
    return new DSL(optimize(this.pipe));
  }

  debugPrint(): string {
    return this.pipe.debugPrint();
  }

  run(inArray: $ReadOnlyArray<I>): Array<O> {
    return execute(inArray, this.pipe);
  }
}

type OperationResult<T> =
  | {|keep: T|}
  | {|many: Array<T>|}
  | {|abort: true|}
  | {|remove: true|};

const removeElement = {remove: true};
const abortIteration = {abort: true};

function execute<I, O>(inArray: $ReadOnlyArray<I>, node: Node<I, O>): Array<O> {
  const arrayLength = inArray.length;
  const outArray = [];
  const compiled = node.compile();
  for (let i = 0; i < arrayLength; i++) {
    const element = inArray[i];
    const r = compiled(element);
    if (r.abort === true) {
      break;
    }
    if (r.remove === true || (r.many && r.many.length === 0)) {
      continue;
    }
    if (r.keep !== undefined) {
      outArray.push(r.keep);
    }
    if (r.many !== undefined) {
      outArray.push(...r.many);
    }
  }
  return outArray;
}

interface Node<I, O> {
  compile(): (element: I) => OperationResult<O>;
  debugPrint(): string;
}

class Combine<I, X, O> implements Node<I, O> {
  left: Node<I, X>;
  right: Node<X, O>;

  constructor(left: Node<I, X>, right: Node<X, O>) {
    this.left = optimize(left);
    this.right = optimize(right);
  }

  debugPrint() {
    return `Combine(${this.left.debugPrint()}, ${this.right.debugPrint()})`;
  }

  compile(): (element: I) => OperationResult<O> {
    const left = this.left.compile();
    const right = this.right.compile();
    return (element) => {
      const r = left(element);
      if (r.keep !== undefined) {
        return right(r.keep);
      } else if (r.abort !== undefined) {
        return abortIteration;
      } else if (r.remove !== undefined || (r.many && r.many.length === 0)) {
        return removeElement;
      } else if (r.many !== undefined) {
        return {many: execute(r.many, this.right)};
      } else {
        throw new Error('This should never happen :)');
      }
    };
  }
}

class Filter<I> implements Node<I, I> {
  filterFun: (element: I) => boolean;

  constructor(filter: (element: I) => boolean) {
    this.filterFun = filter;
  }

  debugPrint() {
    return 'Filter';
  }

  compile(): (element: I) => OperationResult<I> {
    return (element) => {
      if (this.filterFun(element)) {
        return {keep: element};
      }
      return removeElement;
    };
  }
}

class Map<I, O> implements Node<I, O> {
  mapFun: (element: I) => O;

  constructor(map: (element: I) => O) {
    this.mapFun = map;
  }

  debugPrint() {
    return 'Map';
  }

  compile(): (element: I) => OperationResult<O> {
    return (element) => {
      return {keep: this.mapFun(element)};
    };
  }
}

class FilterMap<I, O> implements Node<I, O> {
  mapFun: (element: I) => void | O;

  constructor(map: (element: I) => void | O) {
    this.mapFun = map;
  }

  debugPrint() {
    return 'FilterMap';
  }

  compile(): (element: I) => OperationResult<O> {
    return (element) => {
      const r = this.mapFun(element);
      if (r === undefined) {
        return removeElement;
      }
      return {keep: r};
    };
  }
}

class FlatMap<I, O> implements Node<I, O> {
  mapFun: (element: I) => void | Array<O>;

  constructor(map: (element: I) => void | Array<O>) {
    this.mapFun = map;
  }

  debugPrint() {
    return 'FlatMap';
  }

  compile(): (element: I) => OperationResult<O> {
    return (element) => {
      const r = this.mapFun(element);
      if (r === undefined || r.length === 0) {
        return removeElement;
      }
      return {many: r};
    };
  }
}

class Take<I> implements Node<I, I> {
  counter: number;

  constructor(counter: number) {
    this.counter = counter;
  }

  debugPrint() {
    return `Take[${this.counter}]`;
  }

  compile(): (element: I) => OperationResult<I> {
    let ptr = 0;
    return (element) => {
      if (ptr < this.counter) {
        ptr++;
        return {keep: element};
      }
      return abortIteration;
    };
  }
}

class Drop<I> implements Node<I, I> {
  counter: number;

  constructor(counter: number) {
    this.counter = counter;
  }

  debugPrint() {
    return `Drop[${this.counter}]`;
  }

  compile(): (element: I) => OperationResult<I> {
    let ptr = 0;
    return (element) => {
      if (ptr < this.counter) {
        ptr++;
        return removeElement;
      }
      return {keep: element};
    };
  }
}

class StatefulMap<I, S, O> implements Node<I, O> {
  initialState: () => S;
  reduceFun: (accum: S, element: I) => [S, O];

  constructor(
    initialState: () => S,
    reduceFun: (accum: S, element: I) => [S, O],
  ) {
    this.initialState = initialState;
    this.reduceFun = reduceFun;
  }

  debugPrint() {
    return 'StatefulMap';
  }

  compile(): (element: I) => OperationResult<O> {
    let state = this.initialState();
    return (element) => {
      const r = this.reduceFun(state, element);
      state = r[0];
      return {keep: r[1]};
    };
  }
}

function optimize<I, O>(node: Node<I, O>): Node<I, O> {
  if (node instanceof Combine) {
    const left: Node<I, I> = optimize(node.left);
    const right: Node<I, I> = optimize(node.right);
    if (left instanceof Filter && right instanceof Filter) {
      const filter: Node<I, I> = new Filter(
        (x: I) => left.filterFun(x) && right.filterFun(x),
      );
      return (filter: any); // sad... but there's no way of teaching flow that I ~ O in filter case
    } else if (left instanceof Map && right instanceof Map) {
      const map: Node<I, O> = new Map((x: I) => right.mapFun(left.mapFun(x)));
      return map;
    } else if (left instanceof Map && right instanceof FlatMap) {
      const flatMap: Node<I, O> = new FlatMap((x: I) =>
        right.mapFun(left.mapFun(x)),
      );
      return flatMap;
    } else if (left instanceof Map && right instanceof Filter) {
      const filterMap: Node<I, O> = new FilterMap((x: I) => {
        const r = left.mapFun(x);
        if (right.filterFun(r)) {
          return r;
        }
        return undefined;
      });
      return filterMap;
    } else if (left instanceof Filter && right instanceof Map) {
      const filterMap: Node<I, O> = new FilterMap((x: I) => {
        if (!left.filterFun(x)) {
          return undefined;
        }
        return right.mapFun(x);
      });
      return filterMap;
    } else if (left instanceof FilterMap && right instanceof Map) {
      const filterMap: Node<I, O> = new FilterMap((x: I) => {
        const result = left.mapFun(x);
        if (result === undefined) {
          return undefined;
        }
        return right.mapFun(result);
      });
      return filterMap;
    } else if (left instanceof FilterMap && right instanceof Filter) {
      const filterMap: Node<I, O> = new FilterMap((x: I) => {
        const result = left.mapFun(x);
        if (result === undefined || !right.filterFun(result)) {
          return undefined;
        }
        return result;
      });
      return filterMap;
    } else if (left instanceof Filter && right instanceof FilterMap) {
      const filterMap: Node<I, O> = new FilterMap((x: I) => {
        if (!left.filterFun(x)) {
          return undefined;
        }
        return right.mapFun(x);
      });
      return filterMap;
    } else if (left instanceof FilterMap && right instanceof FlatMap) {
      const filterMap: Node<I, O> = new FlatMap((x: I) => {
        const result = left.mapFun(x);
        if (result === undefined) {
          return undefined;
        }
        return right.mapFun(x);
      });
      return filterMap;
    } else {
      return node;
    }
  } else {
    return node;
  }
}
