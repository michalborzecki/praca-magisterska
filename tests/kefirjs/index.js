import Kefir from 'kefir';

var testsFunctions = {
  simpleChain: config => config.size.map(size => () => simpleChain(size)),
  fullyConnectedLayers: config => config.size.map(size => () => fullyConnectedLayers(size)),
  fullyConnectedLayers2x: config => config.size.map(size => () => fullyConnectedLayers2x(size)),
  simpleSequence: config => config.size.map(size => () => simpleSequence(size)),
  simpleTree: config => config.size.map(size => () => simpleTree(size)),
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
    // if (x === 2 * Math.pow(5, 10)) {
    var evalT0 = performance.now();
    lastObs.onValue((x) => {
      var evalT = performance.now() - evalT0;
      resolve({
        eval: evalT,
      });
    });
    streamEmitter.value(1);
  });
}

function fullyConnectedLayers2x(n) {
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
    
    var evalT0 = performance.now();
    var secondTry = false;
    lastObs.onValue((x) => {
      if (x === Math.pow(n, 10) && !secondTry) {
        secondTry = true;
        streamEmitter.value(2);
      } else if (x === 2 * Math.pow(n, 10)) {
        var evalT = performance.now() - evalT0;
        resolve({
          eval: evalT,
        });
      }
    });
    streamEmitter.value(1);
  });
}

function simpleSequence(n) {
  return new Promise(resolve => {
    var arr = [];
    for (var i = 0; i < n; i++) {
      arr.push(i);
    }

    var streamEmitter = () => {};
    var stream = Kefir.stream(emitter => {
      streamEmitter = emitter;
    });

    var lastObs = stream.map(x => x);
    var counter = 0;
    var evalT0 = performance.now();
    lastObs.onValue((x) => {
      counter++;
      if (counter === n) {
        var evalT = performance.now() - evalT0;
        resolve({
          eval: evalT,
        })
      }
    });
    arr.forEach(x => {
      streamEmitter.emit(x);
    });
  });
}

function simpleTree(n) {
  return new Promise(resolve => {
    var streamEmitter = () => {};
    var stream = Kefir.stream(emitter => {
      streamEmitter = emitter;
    });

    var prevLayer = [stream];
    for (var i = 0; i < n; i++) {
      var nextLayer = [];
      for (var j = 0; j < prevLayer.length; j++) {
        for (var k = 0; k < 3; k++) {
          nextLayer.push(prevLayer[j].map(x => x));
        }
      }
      prevLayer = nextLayer;
    }

    var evalT0;
    var counter = 0;
    for (var i = 0; i < prevLayer.length; i++) {
      prevLayer[i].onValue(() => {
        counter++;
        if (counter === Math.pow(3, n)) {
          var evalT = performance.now() - evalT0;
          resolve({
            eval: evalT,
          })
        }
      });
    }
    
    var evalT0 = performance.now();
    streamEmitter.emit(1);
  });
}
