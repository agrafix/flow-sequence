// @flow

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
  for (let i = 0; i < arrayLength - 1; i++) {
    const element = inArray[i];
    const r = node.run(element);
    if (r.abort === true) {
      break;
    }
    if (r.remove === true) {
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
  run(element: I): OperationResult<O>;
}

class Combine<I, X, O> implements Node<I, O> {
  left: Node<I, X>;
  right: Node<X, O>;

  constructor(left: Node<I, X>, right: Node<X, O>) {
    super();
    this.left = optimize(left);
    this.right = optimize(right);
  }

  run(element: I): OperationResult<O> {
    const r = this.left.run(element);
    if (r.keep !== undefined) {
      return this.right.run(r.keep);
    } else if (r.abort !== undefined) {
      return abortIteration;
    } else if (r.remove !== undefined) {
      return removeElement;
    } else if (r.many !== undefined) {
      return {many: execute(r.many, this.right)};
    } else {
      throw new Error('This should never happen :)');
    }
  }
}

class Filter<I> implements Node<I, I> {
  filterFun: (element: I) => boolean;

  constructor(filter: (element: I) => boolean) {
    super();
    this.filterFun = filter;
  }

  run(element: I): OperationResult<I> {
    if (this.filterFun(element)) {
      return {keep: element};
    }
    return removeElement;
  }
}

class Map<I, O> implements Node<I, O> {
  mapFun: (element: I) => O;

  constructor(map: (element: I) => O) {
    super();
    this.mapFun = map;
  }

  run(element: I): OperationResult<O> {
    return {keep: this.mapFun(element)};
  }
}

class FlatMap<I, O> implements Node<I, O> {
  mapFun: (element: I) => Array<O>;

  constructor(map: (element: I) => Array<O>) {
    super();
    this.mapFun = map;
  }

  run(element: I): OperationResult<O> {
    return {many: this.mapFun(element)};
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
    } else {
      return node;
    }
  } else {
    return node;
  }
}
