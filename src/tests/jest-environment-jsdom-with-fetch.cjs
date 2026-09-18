/**
 * Custom Jest environment: jsdom + Node's native fetch.
 *
 * jest-environment-jsdom replaces the global scope with jsdom's window,
 * which doesn't include fetch. This environment restores Node's native
 * fetch, Request, Response, Headers, and AbortSignal so integration tests
 * can make real HTTP requests while still having a DOM for React rendering.
 */
const JSDOMEnvironment =
  require('jest-environment-jsdom').TestEnvironment ||
  require('jest-environment-jsdom');

class JSDOMWithFetchEnvironment extends JSDOMEnvironment {
  async setup() {
    await super.setup();

    // Restore Node-native fetch globals that jsdom doesn't provide
    if (typeof this.global.fetch !== 'function') {
      this.global.fetch = fetch;
      this.global.Request = Request;
      this.global.Response = Response;
      this.global.Headers = Headers;
    }
  }
}

module.exports = JSDOMWithFetchEnvironment;
