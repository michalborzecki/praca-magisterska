import { map, runEffects, tap, combineArray } from '@most/core';
import { create, event } from 'most-subject';
import { newDefaultScheduler } from '@most/scheduler'

var testsFunctions = {
  simpleChain: config => config.size.map(size => () => simpleChain(size)),
  fullyConnectedLayers: config => config.size.map(size => () => fullyConnectedLayers(size)),
};

performTests('most', testsFunctions);

function simpleChain(n) {
  return new Promise(resolve => {
    var constructT0 = performance.now();

    var scheduler = newDefaultScheduler();
    var [ sink, stream ] = create();
    
    var obs = stream;
    for (var i = 0; i < n; i++) {
      obs = map(x => x + 1, obs);
    }

    var constructT = performance.now() - constructT0;
    var evalT0 = performance.now();

    var subscribe = (x) => {
      var evalT = performance.now() - evalT0;
      resolve({
        construct: constructT,
        eval: evalT,
      });
    };
    runEffects(tap(subscribe, obs), scheduler);

    sink.event(0, 1);
  })
}

function fullyConnectedLayers(n) {
  return new Promise(resolve => {
    var scheduler = newDefaultScheduler();
    var [ sink, stream ] = create();
    
    var obs = stream;

    var prevLayer = [obs];
    for (var i = 0; i < 10; i++) {
      var nextLayer = [];
      for (var j = 0; j < n; j++) {
        nextLayer.push(combineArray(
          (...values) => values.reduce((s, x) => s + x),
          prevLayer
        ));
      }
      prevLayer = nextLayer;
    }
    var lastObs = combineArray(
      (...values) => values.reduce((s, x) => s + x),
      prevLayer
    );
    
    var evalT0 = performance.now();
    var subscribe = (x) => {
      var evalT = performance.now() - evalT0;
      resolve({
        eval: evalT,
      });
    };
    runEffects(tap(subscribe, lastObs), scheduler);

    sink.event(0, 1);
  });
}
