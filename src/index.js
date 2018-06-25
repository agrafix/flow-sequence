// @flow

type OperationResult<T> =
  | {|keep: T|}
  | {|many: Array<T>|}
  | {|abort: true|}
  | {|remove: true|};

export opaque type Operation<T, R> = (element: T) => OperationResult<R>;
export type Chain<T, R> = OpChain<T, R>;

export function chain<T>(): Chain<T, T> {
  return new OpChain(idOp);
}

function apply<T, R>(
  inArray: $ReadOnlyArray<T>,
  op: Operation<T, R>,
): Array<R> {
  const out = [];
  const inLength = inArray.length;
  for (let i = 0; i < inLength; i++) {
    const el = inArray[i];
    const result = op(el);
    if (result.keep !== undefined) {
      out.push(result.keep);
    } else if (result.many !== undefined) {
      out.push(...result.many);
    } else if (result.abort === true) {
      break;
    }
  }
  return out;
}

function combine<T, R, S>(
  left: Operation<T, R>,
  right: Operation<R, S>,
): Operation<T, S> {
  return (element) => {
    const result = left(element);
    if (result.remove || result.abort) {
      return result;
    } else if (result.keep !== undefined) {
      return right(result.keep);
    } else if (result.many !== undefined) {
      return {many: apply(result.many, right)};
    } else {
      throw new Error('Oops');
    }
  };
}

function idOp<T>(e: T): OperationResult<T> {
  return {keep: e};
}

class OpChain<T, R> {
  pendingOperation: Operation<T, R>;

  constructor(initOperation: Operation<T, R>) {
    this.pendingOperation = initOperation;
  }

  run(inArray: $ReadOnlyArray<T>): Array<R> {
    return apply(inArray, this.pendingOperation);
  }

  runReduce<S>(
    inArray: $ReadOnlyArray<T>,
    initAccum: S,
    reduction: (accum: S, element: R) => S,
  ): S {
    let total = initAccum;
    const op: Operation<R, empty> = (e) => {
      total = reduction(total, e);
      return {remove: true};
    };
    new OpChain(combine(this.pendingOperation, op)).run(inArray);
    return total;
  }

  map<S>(f: (element: R) => S): OpChain<T, S> {
    const op: Operation<R, S> = (e) => {
      return {keep: f(e)};
    };
    return new OpChain(combine(this.pendingOperation, op));
  }

  statefulMap<S, U>(
    initAccum: S,
    f: (accum: S, element: R) => [S, U],
  ): OpChain<T, U> {
    let total = initAccum;
    const op: Operation<R, U> = (e) => {
      const out = f(total, e);
      total = out[0];
      return {keep: out[1]};
    };
    return new OpChain(combine(this.pendingOperation, op));
  }

  flatMap<S>(f: (element: R) => Array<S>): OpChain<T, S> {
    const op: Operation<R, S> = (e) => {
      return {many: f(e)};
    };
    return new OpChain(combine(this.pendingOperation, op));
  }

  first(): OpChain<T, R> {
    let output = false;
    const op: Operation<R, R> = (e) => {
      if (!output) {
        output = true;
        return {keep: e};
      }
      return {abort: true};
    };
    return new OpChain(combine(this.pendingOperation, op));
  }

  filter(f: (element: R) => boolean): OpChain<T, R> {
    const op: Operation<R, R> = (e) => {
      if (f(e)) {
        return {keep: e};
      }
      return {remove: true};
    };
    return new OpChain(combine(this.pendingOperation, op));
  }
}
