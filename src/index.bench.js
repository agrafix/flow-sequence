// @flow
import * as Benchmark from 'benchmark';
import {chain} from './index';

type Suite = {
  add: (name: string, bench: () => void) => Suite,
  on: (evt: string, action: (evt: Object) => void) => Suite,
  run: (args: Object) => void,
};

const suite: Suite = new Benchmark.Suite();

const inputArray = Array(100).fill(100);
const chainOfAction = chain()
  .filter((x) => x > 2)
  .map((x) => x + 1)
  .filter((x) => x > 4)
  .flatMap((x) => [x, x]);

type Config = {arraySize: number, arrayValue: number, name: string};

const configurations: $ReadOnlyArray<Config> = [
  {
    arraySize: 10,
    arrayValue: 100,
    name: '10 elements, no early failing',
  },
  {
    arraySize: 100,
    arrayValue: 100,
    name: '100 elements, no early failing',
  },
  {
    arraySize: 10000,
    arrayValue: 100,
    name: '10000 elements, no early failing',
  },
];

configurations
  .reduce((s, cfg: Config) => {
    const inArray = Array(cfg.arraySize).fill(cfg.arrayValue);
    s.add(cfg.name + ': naive chaining', () => {
      const r = inArray
        .filter((x) => x > 2)
        .map((x) => x + 1)
        .filter((x) => x > 4)
        .reduce((acc, x) => acc.concat([x, x]), []);
      r.length;
    });
    s.add(cfg.name + ': flow sequence chaining', () => {
      const r = chainOfAction.run(inArray);
      r.length;
    });
    return s;
  }, suite)
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .run({async: true});
