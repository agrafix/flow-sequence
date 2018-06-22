// @flow

type OperationResult<T> =
    | {|keep: T|}
    | {|many: Array<T> |}
    | {|abort: true|}
    | {|remove: true|};

type Operation<T, R> = (element: T) => OperationResult<R>;

function apply<T, R>(inArray: $ReadOnlyArray<T>, op: Operation<T, R>): Array<R> {
    let out = [];
    for (let i = 0; i < inArray.length; i++) {
        const el = inArray[i];
        const result = op(el);
        if (result.keep) {
            out.push(result.keep);
        } else if (result.many) {
            out.push(...result.many);
        } else if (result.abort) {
            break;
        }
    }
    return out;
}

function combine<T, R, S>(left: Operation<T, R>, right: Operation<R, S>): Operation<T, S> {
    return (element) => {
        const result = left(element);
        if (result.remove || result.abort) {
            return result;
        } else if (result.keep) {
            return right(result.keep)
        } else if (result.many) {
            return {many: apply(result.many, right)};
        } else {
            throw new Error("Oops");
        }
    };
}

const idOp = (e) => {
    return {keep: e};
};

class OpChain<T, R> {
    pendingOperation: Operation<T, R>;

    constructor(initOperation: Operation<T, R>) {
        this.pendingOperation = initOperation;
    }

    map<S>(f: (element: R) => S): OpChain<T, S> {
        const op: Operation<R, S> = (e) => { return {keep: f(e)} };
        return new OpChain(combine(this.pendingOperation, op));
    }

    flatMap<S>(f: (element: R) => Array<S>): OpChain<T, S> {
        const op: Operation<R, S> = (e) => { return {many: f(e)} };
        return new OpChain(combine(this.pendingOperation, op));
    }

    first(): OpChain<T, R> {
        let output = false;
        const op: Operation<R, R> = (e) => {
            if (!output) {
                output = true;
                return {keep: e};
            }
            return {remove: true};
        }
        return new OpChain(combine(this.pendingOperation, op));
    }

    filter(f: (element: R) => boolean): OpChain<T, R> {
        const op: Operation<R, R> = (e) => {
            if (f(e)) {
                return {keep: e};
            }
            return {abort: true};
        };
        return new OpChain(combine(this.pendingOperation, op));
    }
}

type Example = {foo: boolean, bar: number};
const x: OpChain<Example, number> = new OpChain(idOp).filter(x => x.foo == true).map(x => x.bar).first();
