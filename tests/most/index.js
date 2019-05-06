import { map, runEffects, tap, combineArray } from '@most/core';
import { create, event } from 'most-subject';
import { newDefaultScheduler } from '@most/scheduler'

var testsFunctions = {
  simpleChainCreation: config => config.size.map(size => () => simpleChainCreation(size)),
  simpleChainEval: config => config.size.map(size => () => simpleChainEval(size)),
  fullyConnectedLayers: config => config.size.map(size => () => fullyConnectedLayers(size)),
  fullyConnectedLayers2x: config => config.size.map(size => () => fullyConnectedLayers2x(size)),
  simpleSequence: config => config.size.map(size => () => simpleSequence(size)),
  simpleTree: config => config.size.map(size => () => simpleTree(size)),
};

performTests('most', testsFunctions);

function simpleChainCreation(n) {
  return new Promise(resolve => {
    var constructT0 = performance.now();

    var scheduler = newDefaultScheduler();
    var [ sink, stream ] = create();
    
    var obs = stream;
    for (var i = 0; i < n; i++) {
      obs = map(x => x + 1, obs);
    }

    var constructT = performance.now() - constructT0;

    var subscribe = () => {};
    runEffects(tap(subscribe, obs), scheduler);

    resolve({
      construct: constructT,
    });
  })
}

function simpleChainEval(n) {
  return new Promise(resolve => {
    var scheduler = newDefaultScheduler();
    var [ sink, stream ] = create();
    
    var obs = stream;
    for (var i = 0; i < n; i++) {
      obs = map(x => x + 1, obs);
    }

    var evalT0 = performance.now();

    var subscribe = (x) => {
      var evalT = performance.now() - evalT0;
      resolve({
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
    for (var i = 0; i < 8; i++) {
      var nextLayer = [];
      var nodesNo = Math.floor(n) + (i/8 < (n % 1) ? 1 : 0);
      for (var j = 0; j < nodesNo; j++) {
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
    for (var i = 0; i < 8; i++) {
      var nextLayer = [];
      var nodesNo = Math.floor(n) + (i/8 < (n % 1) ? 1 : 0);
      for (var j = 0; j < nodesNo; j++) {
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
    const pow = Math.pow(Math.floor(n) + 1, (n % 1) * 8) * Math.pow(Math.floor(n), 8 * (1 - (n % 1)));
    var subscribe = (x) => {
      if (x === pow && !secondTry) {
        secondTry = true;
        sink.event(0, 2);
      } else if (x === 2 * pow) {
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
        for (var k = 0; k < 2; k++) {
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
        if (counter === Math.pow(2, n)) {
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
