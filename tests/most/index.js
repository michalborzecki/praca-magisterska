import { map, runEffects, tap, combineArray } from '@most/core';
import { create, event } from 'most-subject';
import { newDefaultScheduler } from '@most/scheduler'

var testsFunctions = {
  simpleChain: config => config.size.map(size => () => simpleChain(size)),
  fullyConnectedLayers: config => config.size.map(size => () => fullyConnectedLayers(size)),
  fullyConnectedLayers2x: config => config.size.map(size => () => fullyConnectedLayers2x(size)),
  simpleSequence: config => config.size.map(size => () => simpleSequence(size)),
  simpleTree: config => config.size.map(size => () => simpleTree(size)),
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

function fullyConnectedLayers2x(n) {
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
    var secondTry = false;
    var subscribe = (x) => {
      if (x === Math.pow(n, 10) && !secondTry) {
        secondTry = true;
        sink.event(0, 2);
      } else if (x === 2 * Math.pow(n, 10)) {
        var evalT = performance.now() - evalT0;
        resolve({
          eval: evalT,
        });
      }
    };
    runEffects(tap(subscribe, lastObs), scheduler);

    sink.event(0, 1);
  });
}

function simpleSequence(n) {
  return new Promise(resolve => {
    var arr = [];
    for (var i = 0; i < n; i++) {
      arr.push(i);
    }

    var scheduler = newDefaultScheduler();
    var [ sink, stream ] = create();

    var lastObs = map(x => x, stream);
    var counter = 0;
    var evalT0 = performance.now();
    var subscribe = (x) => {
      counter++;
      if (counter === n) {
        var evalT = performance.now() - evalT0;
        resolve({
          eval: evalT,
        })
      }
    };
    runEffects(tap(subscribe, lastObs), scheduler);
    arr.forEach(x => {
      sink.event(0, x);
    });
  });
}

function simpleTree(n) {
  return new Promise(resolve => {
    var scheduler = newDefaultScheduler();
    var [ sink, stream ] = create();

    var prevLayer = [stream];
    for (var i = 0; i < n; i++) {
      var nextLayer = [];
      for (var j = 0; j < prevLayer.length; j++) {
        for (var k = 0; k < 3; k++) {
          nextLayer.push(map(x => x, prevLayer[j]));
        }
      }
      prevLayer = nextLayer;
    }

    var evalT0;
    var counter = 0;
    for (var i = 0; i < prevLayer.length; i++) {
      runEffects(tap(() => {
        counter++;
        if (counter === Math.pow(3, n)) {
          var evalT = performance.now() - evalT0;
          resolve({
            eval: evalT,
          })
        }
      }, prevLayer[i]), scheduler);
    }
    
    var evalT0 = performance.now();
    sink.event(0, 1);
  });
}
