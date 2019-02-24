import Component from '@ember/component';
import EmberObject, { computed, observer } from '@ember/object';
import { next } from '@ember/runloop';

export default Component.extend({
  didInsertElement() {
    this._super(...arguments);
    this.runTests();
  },

  runTests() {
    const testsFunctions = {
      simpleChain: config => config.size.map(size => () => this.simpleChain(size)),
      fullyConnectedLayers: config => config.size.map(size => () => this.fullyConnectedLayers(size)),
      fullyConnectedLayers2x: config => config.size.map(size => () => this.fullyConnectedLayers2x(size)),
      simpleSequence: config => config.size.map(size => () => this.simpleSequence(size)),
      simpleTree: config => config.size.map(size => () => this.simpleTree(size)),
    };
    window.performTests('emberjs', testsFunctions);
  },

  simpleChain(size) {
    return new Promise(resolve => {
      const constructT0 = performance.now();

      const times = {}
      const objExtend = {
        cObserver: observer('c' + size, function () {
          const evalT = performance.now() - times.evalT0;
          resolve({
            construct: times.constructT,
            eval: evalT,
          });
        }),
        init() {
          this._super(...arguments);
          this.get('c' + size);
        }
      };
      for (let i = 0; i < size; i++) {
        objExtend['c' + (i+1)] = computed('c' + i, function () {
          return this.get('c' + i) + 1;
        });
      }
      const ObjectClass = EmberObject.extend(objExtend);

      const obj = ObjectClass.create();
      times.constructT = performance.now() - constructT0;
      times.evalT0 = performance.now();
      obj.set('c0', 1);
    });
  },

  fullyConnectedLayers(n) {
    return new Promise(resolve => {
      const times = {}

      const levels = 10;
      const fieldNames = (level) => {
        const names = [];
        for (let i = 0; i < n; i++) {
          names.push(`c${level}-${i}`);
        }
        return names;
      };
      const objExtend = {
        co: computed(...fieldNames(levels), function () {
          return this.sumFields(fieldNames(levels));
        }),
        cObserver: observer('co', function () {
          if (!this.get('co')) {
            return;
          }
          const evalT = performance.now() - times.evalT0;
          resolve({
            eval: evalT,
          });
        }),
        init() {
          this._super(...arguments);
          this.get('co');
        },
        sumFields(fieldNames) {
          const props = this.getProperties(fieldNames);
          return fieldNames.reduce((s, n) => s + props[n], 0);
        },
      };

      let prevLayer = ['c0'];
      for (var i = 1; i <= levels; i++) {
        let nextLayer = fieldNames(i);
        let prevLayerCopy = prevLayer.slice(0);
        for (var j = 0; j < n; j++) {
          objExtend[nextLayer[j]] = computed(...prevLayerCopy, function () {
            return this.sumFields(prevLayerCopy);
          });
        }
        prevLayer = nextLayer;
      }
      const ObjectClass = EmberObject.extend(objExtend);

      const obj = ObjectClass.create();
      times.evalT0 = performance.now();
      obj.set('c0', 1);
      obj.notifyPropertyChange(`c${levels}-0`);
    });
  },

  fullyConnectedLayers2x(n) {
    return new Promise(resolve => {
      const times = {}

      const levels = 10;
      const fieldNames = (level) => {
        const names = [];
        for (let i = 0; i < n; i++) {
          names.push(`c${level}-${i}`);
        }
        return names;
      };
      const objExtend = {
        secondTry: false,
        co: computed(...fieldNames(levels), function () {
          return this.sumFields(fieldNames(levels));
        }),
        cObserver: observer('co', function () {
          const co = this.get('co');
          if (!co) {
            return;
          }
          if (co === Math.pow(n, 10) && !this.get('secondTry')) {
            this.set('secondTry', true);
            next(() => {
              this.set('c0', 2);
              this.notifyPropertyChange(`c${levels}-0`);
            });
          } else if (co === 2 * Math.pow(n, 10)) {
            const evalT = performance.now() - times.evalT0;
            resolve({
              eval: evalT,
            });
          }
        }),
        init() {
          this._super(...arguments);
          this.get('co');
        },
        sumFields(fieldNames) {
          const props = this.getProperties(fieldNames);
          return fieldNames.reduce((s, n) => s + props[n], 0);
        },
      };

      let prevLayer = ['c0'];
      for (var i = 1; i <= levels; i++) {
        let nextLayer = fieldNames(i);
        let prevLayerCopy = prevLayer.slice(0);
        for (var j = 0; j < n; j++) {
          objExtend[nextLayer[j]] = computed(...prevLayerCopy, function () {
            return this.sumFields(prevLayerCopy);
          });
        }
        prevLayer = nextLayer;
      }
      const ObjectClass = EmberObject.extend(objExtend);

      const obj = ObjectClass.create();
      times.evalT0 = performance.now();
      obj.set('c0', 1);
      obj.notifyPropertyChange(`c${levels}-0`);
    });
  },

  simpleSequence(size) {
    return new Promise(resolve => {
      var arr = [];
      for (var i = 0; i < size; i++) {
        arr.push(i);
      }
      const times = {}
      const objExtend = {
        counter: 0,
        c1: computed('c0', function () {
          return this.get('c0');
        }),
        cObserver: observer('c1', function () {
          this.set('counter', this.get('counter') + 1);
          if (this.get('counter') === size) {
            const evalT = performance.now() - times.evalT0;
            resolve({
              eval: evalT,
            });
          }
        }),
        init() {
          this._super(...arguments);
          this.get('c1');
        }
      };

      const ObjectClass = EmberObject.extend(objExtend);

      const obj = ObjectClass.create();
      times.evalT0 = performance.now();
      arr.forEach(x => {
        obj.set('c0', x);
        obj.notifyPropertyChange(`c1`);
      });
    });
  },

  simpleTree(n) {
    return new Promise(resolve => {
      const times = {}

      const fieldNames = (level) => {
        const names = [];
        for (let i = 0; i < Math.pow(3, level); i++) {
          names.push(`c${level}-${i}`);
        }
        return names;
      };
      const objExtend = {
        counter: 0,
        init() {
          this._super(...arguments);
          const names = fieldNames(n);
          this.get(names[0]);
          names.forEach(name => this.get(name));
        },
      };

      let prevLayer = ['c0'];
      for (var i = 1; i <= n; i++) {
        let nextLayer = fieldNames(i);
        for (var j = 0; j < nextLayer.length; j++) {
          var prevIndex = Math.floor(j / 3);
          const prevName = prevLayer[prevIndex];
          objExtend[nextLayer[j]] = computed(prevName, function () {
            return this.get(prevName);
          });
        }
        prevLayer = nextLayer;
      }
      for (i = 0; i < prevLayer.length; i++) {
        objExtend[prevLayer[i] + 'Obs'] = observer(prevLayer[i], function () {
          this.incrementProperty('counter');
          if (this.get('counter') === Math.pow(3, n)) {
            var evalT = performance.now() - times.evalT0;
            resolve({
              eval: evalT,
            })
          }
        })
      }
      const ObjectClass = EmberObject.extend(objExtend);

      const obj = ObjectClass.create();
      times.evalT0 = performance.now();
      obj.set('c0', 1);
    });
  },
});
