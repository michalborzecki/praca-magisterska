import Kefir from 'kefir';

var testsFunctions = {
  simpleChain: config => config.size.map(size => () => simpleChain(size)),
  fullyConnectedLayers: config => config.size.map(size => () => fullyConnectedLayers(size)),
};

performTests('kefirjs', testsFunctions);

function simpleChain(n) {
  return new Promise(resolve => {
    var constructT0 = performance.now();

    var streamEmitter = () => {};
    var stream = Kefir.stream(emitter => {
      streamEmitter = emitter;
    });
    var obs = stream;
    for (var i = 0; i < n; i++) {
      obs = obs.map(x => x + 1);
    }

    var constructT = performance.now() - constructT0;
    var evalT0 = performance.now();

    obs.onValue((x) => {
      var evalT = performance.now() - evalT0;
      resolve({
        construct: constructT,
        eval: evalT,
      });
    });
    streamEmitter.value(1);
  })
}

function fullyConnectedLayers(n) {
  return new Promise(resolve => {
    var streamEmitter = () => {};
    var stream = Kefir.stream(emitter => {
      streamEmitter = emitter;
    });
    var obs = stream;

    var prevLayer = [obs];
    for (var i = 0; i < 10; i++) {
      var nextLayer = [];
      for (var j = 0; j < n; j++) {
        nextLayer.push(Kefir.combine(
          prevLayer,
          (...values) => values.reduce((s, x) => s + x)
        ));
      }
      prevLayer = nextLayer;
    }
    var lastObs = Kefir.combine(
      prevLayer,
      (...values) => values.reduce((s, x) => s + x)
    );
    
    var evalT0;
    var i = 0;
    lastObs.onValue((x) => {
      if (x === 2 * Math.pow(5, 10)) {
        var evalT = performance.now() - evalT0;
        console.log(x);
        resolve({
          eval: evalT,
        });
      } else if (i == 0) {
        // setTimeout(() => {
          i++;
          evalT0 = performance.now();
          streamEmitter.value(2);
        // }, 100);
      }
    });
    streamEmitter.value(1);
  });
}
