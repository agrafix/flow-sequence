// @flow
import * as Benchmark from 'benchmark';
import {chain} from './index';

const suite = new Benchmark.Suite;

const inputArray = Array(100).fill(100);
const chainOfAction = chain().filter(x => x > 2).map(x => x + 1).filter(x => x > 4).flatMap(x => [x, x]);

suite.add('naive chaining', () => {
  const r =
    inputArray.filter(x => x > 2).map(x => x + 1).filter(x => x > 4).reduce((acc, x) => acc.concat([x, x]), []);
  r.length;
})
.add('flow sequence chaining', function() {
  const r = chainOfAction.run(inputArray);
  r.length;
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.run({ 'async': true });
