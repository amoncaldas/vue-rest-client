"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CrudHttp =
/**
 * Build and cofigure the http client instance
 * @param {Object} vueInstance
 * @param {Object} options - object containing:
 * {
 *  baseURL: String
 *  isAuthenticated: Function,
 *  getBearerToken: Function,
 *  geLocale: Function,
 *  appendLocaleToHeader: Boolean,
 *  appendLocaleToGetUrl: Boolean,
 *  urlLocalKey: String
 * }
 */
function CrudHttp() {
  var _this = this;

  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  _classCallCheck(this, CrudHttp);

  this.setDefaultOptions = function () {
    _this.options.baseURL = _this.options.baseURL || '';
    _this.options.showLoadingEventName = _this.options.showLoadingEventName || 'showLoading';

    if (typeof _this.options.isAuthenticated !== "function") {
      _this.options.isAuthenticated = function () {
        return false;
      };
    }

    if (typeof _this.options.getBearerToken !== "function") {
      _this.options.getBearerToken = function () {
        return null;
      };
    }

    if (typeof _this.options.geLocale !== "function") {
      _this.options.geLocale = function () {
        return null;
      };
    }

    if (typeof _this.options.getVueInstance !== "function") {
      _this.options.getVueInstance = function () {
        console.log('The vue instance getting function was not defined');
        return null;
      };
    }

    if (typeof _this.options.appendLocaleToHeader === 'undefined') {
      _this.options.appendLocaleToHeader = false;
    }

    if (typeof _this.options.appendLocaleToGetUrl === 'undefined') {
      _this.options.appendLocaleToGetUrl = false;
    } else if (_this.options.appendLocaleToGetUrl === true) {
      _this.options.urlLocalKey = _this.options.urlLocalKey || 'l';
    }
  };

  this.requestInterceptors = function (config) {
    var vueInstance = _this.options.getVueInstance();

    if (vueInstance) {
      // if yes, show the loading and add the authorization header
      if (vueInstance.eventBus) {
        vueInstance.eventBus.$emit(_this.options.showLoadingEventName, true);
      } // Set/increase the pending request counter


      vueInstance.$pendingRequest = vueInstance.$pendingRequest ? vueInstance.$pendingRequest + 1 : 1;
    } // Before each request, we check if the user is authenticated
    // This store isAuthenticated getter relies on the @/common/auth/auth.store.js module


    if (_this.options.isAuthenticated()) {
      config.headers.common['Authorization'] = 'Bearer ' + _this.options.getBearerToken();
    }

    var currentLocale = _this.options.geLocale();

    if (_this.options.appendLocaleToHeader && currentLocale) {
      config.headers.common['locale'] = _this.options.geLocale();
    }

    if (_this.options.appendLocaleToGetUrl) {
      var lUrlKey = _this.options.urlLocalKey;
      var urlQueryString = "=".concat(lUrlKey); // Check if the locael query string should be added

      if (config.method === 'get' && config.url.indexOf(urlQueryString) === -1 && currentLocale) {
        if (config.url.indexOf('?') > -1) {
          config.url += "&".concat(lUrlKey, "=").concat(currentLocale);
        } else {
          config.url += "?".concat(lUrlKey, "=").concat(currentLocale);
        }
      }
    }

    return config; // you have to return the config, otherwise the request wil be blocked
  };

  this.responseInterceptors = function (response) {
    var vueInstance = _this.options.getVueInstance();

    if (vueInstance) {
      // Decrease the pending request counter
      vueInstance.$pendingRequest--; // If the the pending request counter is zero, so
      // we can hide the progress bar

      if (vueInstance.$pendingRequest === 0 && vueInstance.eventBus) {
        vueInstance.eventBus.$emit(_this.options.showLoadingEventName, false);
      }
    }

    response = response.response || response;
    response.data = response.data || {};
    return response;
  };

  this.responseErrorInterceptors = function (response) {
    var vueInstance = _this.options.getVueInstance();

    return new Promise(function (resolve, reject) {
      if (vueInstance) {
        // Decrease the pending request counter
        vueInstance.$pendingRequest--; // If the the pending request counter is zero, so
        // we can hide the progress bar

        if (vueInstance.$pendingRequest === 0 && vueInstance.eventBus) {
          vueInstance.eventBus.$emit(_this.options.showLoadingEventName, false);
        }
      }

      response = response.response || response;
      response.data = response.data || {};
      reject(response);
    });
  };

  this.options = options;
  this.setDefaultOptions(); // Build an axios object

  var httpApi = _axios["default"].create({
    baseURL: options.baseURL,
    headers: {}
  });

  httpApi.interceptors.request.use(this.requestInterceptors);
  httpApi.interceptors.response.use(this.responseInterceptors, this.responseErrorInterceptors);
  this.http = httpApi;
}
/**
 * Set default options
 */
;

var _default = CrudHttp;
exports["default"] = _default;