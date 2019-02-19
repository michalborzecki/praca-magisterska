import Component from '@ember/component';
import EmberObject, { computed, observer } from '@ember/object';

export default Component.extend({
  didInsertElement() {
    this._super(...arguments);
    this.runTests();
  },

  runTests() {
    const testsFunctions = {
      simpleChain: config => config.size.map(size => () => this.simpleChain(size)),
      fullyConnectedLayers: config => config.size.map(size => () => this.fullyConnectedLayers(size)),
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
  }
});
