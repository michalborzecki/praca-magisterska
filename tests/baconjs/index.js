import bacon from 'baconjs';

var testsFunctions = {
  simpleChainCreation: config => config.size.map(size => () => simpleChainCreation(size)),
  simpleChainEval: config => config.size.map(size => () => simpleChainEval(size)),
  fullyConnectedLayers: config => config.size.map(size => () => fullyConnectedLayers(size)),
  fullyConnectedLayers2x: config => config.size.map(size => () => fullyConnectedLayers2x(size)),
  simpleSequence: config => config.size.map(size => () => simpleSequence(size)),
  simpleTree: config => config.size.map(size => () => simpleTree(size)),
};

setTimeout(() => performTests('baconjs', testsFunctions, 1000));

function simpleChainCreation(n) {
  return new Promise(resolve => {
    var constructT0 = performance.now();

    var bus = new bacon.Bus();
    var obs = bus;

    for (var i = 0; i < n; i++) {
      obs = obs.map(x => x + 1);
    }

    var constructT = performance.now() - constructT0;

    var evalT0 = performance.now();
    obs.subscribe(() => {});
    resolve({
      construct: constructT,
    });
  })
}

function simpleChainEval(n) {
  return new Promise(resolve => {
    var bus = new bacon.Bus();
    var obs = bus;

    for (var i = 0; i < n; i++) {
      obs = obs.map(x => x + 1);
    }

    var evalT0 = performance.now();
    obs.subscribe(() => {
      var evalT = performance.now() - evalT0;
      resolve({
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
    for (var i = 0; i < 8; i++) {
      var nextLayer = [];
      var nodesNo = Math.floor(n) + (i/8 < (n % 1) ? 1 : 0);
      for (var j = 0; j < nodesNo; j++) {
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
    lastObs.subscribe((x) => {
      var evalT = performance.now() - evalT0;
      resolve({
        eval: evalT,
      });
    });
    bus.push(1);
  });
}

function fullyConnectedLayers2x(n) {
  return new Promise(resolve => {
    var bus = new bacon.Bus();
    var obs = bus;

    var prevLayer = [obs];
    for (var i = 0; i < 8; i++) {
      var nextLayer = [];
      var nodesNo = Math.floor(n) + (i/8 < (n % 1) ? 1 : 0);
      for (var j = 0; j < nodesNo; j++) {
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
    var secondTry = false;
    const pow = Math.pow(Math.floor(n) + 1, (n % 1) * 8) * Math.pow(Math.floor(n), 8 * (1 - (n % 1)));
    lastObs.subscribe(({value}) => {
      if (value === pow && !secondTry) {
        secondTry = true;
        bus.push(2);
      } else if (value === 2 * pow) {
        var evalT = performance.now() - evalT0;
        resolve({
          eval: evalT,
        });
      }
    });
    bus.push(1);
  });
}

function simpleSequence(n) {
  return new Promise(resolve => {
    var arr = [];
    for (var i = 0; i < n; i++) {
      arr.push(i);
    }

    var obs = bacon.fromArray(arr);
    var lastObs = obs.map(x => x + 1);
    var counter = 0;
    var evalT0 = performance.now();
    lastObs.subscribe(({ value }) => {
      counter++;
      if (counter === n) {
        var evalT = performance.now() - evalT0;
        resolve({
          eval: evalT,
        })
      }
    });
  });
}

function simpleTree(n) {
  return new Promise(resolve => {
    var bus = new bacon.Bus();
    var obs = bus;

    var prevLayer = [obs];
    for (var i = 0; i < n; i++) {
      var nextLayer = [];
      for (var j = 0; j < prevLayer.length; j++) {
        for (var k = 0; k < 2; k++) {
          nextLayer.push(prevLayer[j].map(x => x));
        }
      }
      prevLayer = nextLayer;
    }

    var evalT0;
    var counter = 0;
    for (var i = 0; i < prevLayer.length; i++) {
      prevLayer[i].subscribe(() => {
        counter++;
        if (counter === Math.pow(2, n)) {
          var evalT = performance.now() - evalT0;
          resolve({
            eval: evalT,
          })
        }
      });
    }
    
    var evalT0 = performance.now();
    bus.push(1);
  });
}
