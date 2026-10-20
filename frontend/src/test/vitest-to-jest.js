// Pont de compatibilité Vitest -> Jest
// Permet d'exécuter la même suite de tests sous Jest sans modifier les imports
const exp = (...args) => global.expect(...args);
Object.assign(exp, global.expect);

module.exports = {
  describe: global.describe,
  it: global.it,
  test: global.test,
  expect: global.expect,
  beforeEach: global.beforeEach,
  afterEach: global.afterEach,
  beforeAll: global.beforeAll,
  afterAll: global.afterAll,
  vi: {
    fn: (...args) => jest.fn(...args),
    spyOn: (...args) => jest.spyOn(...args),
    mock: (...args) => jest.mock(...args),
    clearAllMocks: () => jest.clearAllMocks(),
    resetAllMocks: () => jest.resetAllMocks(),
    restoreAllMocks: () => jest.restoreAllMocks(),
  }
};
