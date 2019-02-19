import bacon from 'baconjs';

var testsFunctions = {
  simpleChain: config => config.size.map(size => () => simpleChain(size)),
  fullyConnectedLayers: config => config.size.map(size => () => fullyConnectedLayers(size)),
};

performTests('baconjs', testsFunctions);

function simpleChain(n) {
  return new Promise(resolve => {
    var constructT0 = performance.now();

    var bus = new bacon.Bus();
    var obs = bus;

    for (var i = 0; i < n; i++) {
      obs = obs.map(x => x + 1);
    }

    var constructT = performance.now() - constructT0;

    var evalT0 = performance.now();
    obs.subscribe(() => {
      var evalT = performance.now() - evalT0;
      resolve({
        construct: constructT,
        eval: evalT,
      });
    });
    bus.push(1);
  })
}

function fullyConnectedLayers(n) {
  return new Promise(resolve => {
    var bus = new bacon.Bus();
    var obs = bus;

    var prevLayer = [obs];
    for (var i = 0; i < 10; i++) {
      var nextLayer = [];
      for (var j = 0; j < n; j++) {
        nextLayer.push(bacon.combineWith(
          prevLayer,
          (...values) => values.reduce((s, x) => s + x)
        ));
      }
      prevLayer = nextLayer;
    }
    var lastObs = bacon.combineWith(
      prevLayer,
      (...values) => values.reduce((s, x) => s + x)
    );
    
    var evalT0 = performance.now();
    var i = 0;
    lastObs.subscribe((x) => {
      i++;
      if (i >= 2) {
        var evalT = performance.now() - evalT0;
        console.log(x);
        resolve({
          eval: evalT,
        });
      } else {
        evalT0 = performance.now();
        bus.push(2);
        // }, 100);
      }
      // resolve({
      //   eval: evalT,
      // });
    });
    bus.push(1);
  });
}
