(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = require('./lib/axios');
},{"./lib/axios":3}],2:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var buildURL = require('./../helpers/buildURL');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    // Listen for ready state
    request.onreadystatechange = function handleLoad() {
      if (!request || request.readyState !== 4) {
        return;
      }

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      }

      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      var cookies = require('./../helpers/cookies');

      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ?
          cookies.read(config.xsrfCookieName) :
          undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (config.withCredentials) {
      request.withCredentials = true;
    }

    // Add responseType to request if needed
    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e;
        }
      }
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }

    if (requestData === undefined) {
      requestData = null;
    }

    // Send the request
    request.send(requestData);
  });
};

},{"../core/createError":9,"./../core/settle":12,"./../helpers/buildURL":16,"./../helpers/cookies":18,"./../helpers/isURLSameOrigin":20,"./../helpers/parseHeaders":22,"./../utils":24}],3:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Factory for creating new instances
axios.create = function create(instanceConfig) {
  return createInstance(utils.merge(defaults, instanceConfig));
};

// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;

},{"./cancel/Cancel":4,"./cancel/CancelToken":5,"./cancel/isCancel":6,"./core/Axios":7,"./defaults":14,"./helpers/bind":15,"./helpers/spread":23,"./utils":24}],4:[function(require,module,exports){
'use strict';

/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function Cancel(message) {
  this.message = message;
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

Cancel.prototype.__CANCEL__ = true;

module.exports = Cancel;

},{}],5:[function(require,module,exports){
'use strict';

var Cancel = require('./Cancel');

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;

},{"./Cancel":4}],6:[function(require,module,exports){
'use strict';

module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

},{}],7:[function(require,module,exports){
'use strict';

var defaults = require('./../defaults');
var utils = require('./../utils');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = utils.merge({
      url: arguments[0]
    }, arguments[1]);
  }

  config = utils.merge(defaults, {method: 'get'}, this.defaults, config);
  config.method = config.method.toLowerCase();

  // Hook up interceptors middleware
  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);

  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;

},{"./../defaults":14,"./../utils":24,"./InterceptorManager":8,"./dispatchRequest":10}],8:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;

},{"./../utils":24}],9:[function(require,module,exports){
'use strict';

var enhanceError = require('./enhanceError');

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
module.exports = function createError(message, config, code, request, response) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};

},{"./enhanceError":11}],10:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');
var isAbsoluteURL = require('./../helpers/isAbsoluteURL');
var combineURLs = require('./../helpers/combineURLs');

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Support baseURL config
  if (config.baseURL && !isAbsoluteURL(config.url)) {
    config.url = combineURLs(config.baseURL, config.url);
  }

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers || {}
  );

  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};

},{"../cancel/isCancel":6,"../defaults":14,"./../helpers/combineURLs":17,"./../helpers/isAbsoluteURL":19,"./../utils":24,"./transformData":13}],11:[function(require,module,exports){
'use strict';

/**
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */
module.exports = function enhanceError(error, config, code, request, response) {
  error.config = config;
  if (code) {
    error.code = code;
  }
  error.request = request;
  error.response = response;
  return error;
};

},{}],12:[function(require,module,exports){
'use strict';

var createError = require('./createError');

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  // Note: status is not exposed by XDomainRequest
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};

},{"./createError":9}],13:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn(data, headers);
  });

  return data;
};

},{"./../utils":24}],14:[function(require,module,exports){
(function (process){
'use strict';

var utils = require('./utils');
var normalizeHeaderName = require('./helpers/normalizeHeaderName');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr');
  } else if (typeof process !== 'undefined') {
    // For node use HTTP adapter
    adapter = require('./adapters/http');
  }
  return adapter;
}

var defaults = {
  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Content-Type');
    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    if (utils.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      return JSON.stringify(data);
    }
    return data;
  }],

  transformResponse: [function transformResponse(data) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) { /* Ignore */ }
    }
    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  }
};

defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;

}).call(this,require('_process'))
},{"./adapters/http":2,"./adapters/xhr":2,"./helpers/normalizeHeaderName":21,"./utils":24,"_process":26}],15:[function(require,module,exports){
'use strict';

module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};

},{}],16:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%40/gi, '@').
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

},{"./../utils":24}],17:[function(require,module,exports){
'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};

},{}],18:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
  (function standardBrowserEnv() {
    return {
      write: function write(name, value, expires, path, domain, secure) {
        var cookie = [];
        cookie.push(name + '=' + encodeURIComponent(value));

        if (utils.isNumber(expires)) {
          cookie.push('expires=' + new Date(expires).toGMTString());
        }

        if (utils.isString(path)) {
          cookie.push('path=' + path);
        }

        if (utils.isString(domain)) {
          cookie.push('domain=' + domain);
        }

        if (secure === true) {
          cookie.push('secure');
        }

        document.cookie = cookie.join('; ');
      },

      read: function read(name) {
        var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
        return (match ? decodeURIComponent(match[3]) : null);
      },

      remove: function remove(name) {
        this.write(name, '', Date.now() - 86400000);
      }
    };
  })() :

  // Non standard browser env (web workers, react-native) lack needed support.
  (function nonStandardBrowserEnv() {
    return {
      write: function write() {},
      read: function read() { return null; },
      remove: function remove() {}
    };
  })()
);

},{"./../utils":24}],19:[function(require,module,exports){
'use strict';

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};

},{}],20:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
  (function standardBrowserEnv() {
    var msie = /(msie|trident)/i.test(navigator.userAgent);
    var urlParsingNode = document.createElement('a');
    var originURL;

    /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
    function resolveURL(url) {
      var href = url;

      if (msie) {
        // IE needs attribute set twice to normalize properties
        urlParsingNode.setAttribute('href', href);
        href = urlParsingNode.href;
      }

      urlParsingNode.setAttribute('href', href);

      // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
      return {
        href: urlParsingNode.href,
        protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
        host: urlParsingNode.host,
        search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
        hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
        hostname: urlParsingNode.hostname,
        port: urlParsingNode.port,
        pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                  urlParsingNode.pathname :
                  '/' + urlParsingNode.pathname
      };
    }

    originURL = resolveURL(window.location.href);

    /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
    return function isURLSameOrigin(requestURL) {
      var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
      return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
    };
  })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
  (function nonStandardBrowserEnv() {
    return function isURLSameOrigin() {
      return true;
    };
  })()
);

},{"./../utils":24}],21:[function(require,module,exports){
'use strict';

var utils = require('../utils');

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};

},{"../utils":24}],22:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};

},{"./../utils":24}],23:[function(require,module,exports){
'use strict';

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

},{}],24:[function(require,module,exports){
'use strict';

var bind = require('./helpers/bind');
var isBuffer = require('is-buffer');

/*global toString:true*/

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return toString.call(val) === '[object Array]';
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
function isArrayBuffer(val) {
  return toString.call(val) === '[object ArrayBuffer]';
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(val) {
  return (typeof FormData !== 'undefined') && (val instanceof FormData);
}

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
  return toString.call(val) === '[object Date]';
}

/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
function isFile(val) {
  return toString.call(val) === '[object File]';
}

/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
function isURLSearchParams(val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return false;
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (typeof result[key] === 'object' && typeof val === 'object') {
      result[key] = merge(result[key], val);
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim
};

},{"./helpers/bind":15,"is-buffer":25}],25:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

module.exports = function isBuffer (obj) {
  return obj != null && obj.constructor != null &&
    typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

},{}],26:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CRUDData = exports.CRUD = void 0;

var _formHelper = _interopRequireDefault(require("./form-helper"));

var _crudI18n = _interopRequireDefault(require("./i18n/crud.i18n.en"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var CRUD = /*#__PURE__*/function () {
  function CRUD(vm, modelService, options) {
    _classCallCheck(this, CRUD);

    _initialiseProps.call(this);

    this.vm = vm;
    this.modelService = modelService; // If options is not passed, initialize it

    this.options = options || {};
    this.run();
  }
  /**
   * Set the crud for he given view model, service and options
   * @param {*} vm
   * @param {*} modelService
   * @param {*} options
   */


  _createClass(CRUD, [{
    key: "run",

    /**
     * The initial function is executed when the class is built
     * if the option queryOnStartup is true, it will also load the resources automatically.
     */
    value: function run() {
      var _this = this;

      this.vm.resource = this.modelService.newModelInstance(); // Add the CRUD methods to the view model (vm) passed to the constructor

      this.vm.index = this.index;
      this.vm.get = this.get;
      this.vm.save = this.save;
      this.vm.update = this.update;
      this.vm.destroy = this.destroy;
      this.vm.confirmAndDestroy = this.confirmAndDestroy;
      this.vm.$t = this.options.translate || this.vm.$t || this.translate;
      this.vm.showSuccess = this.options.showSuccess || this.vm.showSuccess || this.showSuccess;
      this.vm.showInfo = this.options.showInfo || this.vm.showInfo || this.showSuccess;
      this.vm.showError = this.options.showError || this.vm.showError || this.showSuccess;
      this.vm.confirmDialog = this.options.confirmDialog || this.vm.confirmDialog || this.confirmDialog; // If quey on start up is enabled,
      // run the initial query

      if (this.options.queryOnStartup) {
        this.vm.index().then(function (resources) {
          _this.vm.resources = resources;
          _this.vm.crudReady = true;
        });
      }
    }
    /**
     * Alternative function to show CRUD error
     * @param {String} key
     * @return {String} msg
     */

  }, {
    key: "handleError",

    /**
     * Handle the error response
     *
     * @param {*} response
     * @param {*} actionMsg
     * @param {*} defaultCrudMsg
     * @memberof CRUD
     */
    value: function handleError(response, actionMsg, defaultCrudMsg) {
      // There is no response message in this case, so we define the message considering the options custom message, the options status msg or the default one
      var treatment = this.getErrorTreatment(response, actionMsg, defaultCrudMsg);

      if (treatment !== false) {
        if (typeof treatment !== 'function') {
          this.showErrorMessage(response, treatment);
        } else {
          treatment(response, actionMsg, defaultCrudMsg);
        }
      }

      this.runAfterCallBack('afterError', response);
    }
    /**
     * Build the error message
     *
     * @param {*} errorResponse
     * @param {*} crudErrorMessage
     * @param {*} eventMsg
     * @returns {String|false|function} (if false, means no error message should be displayed)
     * @memberof CRUD
     */

  }, {
    key: "getErrorTreatment",
    value: function getErrorTreatment(errorResponse, eventMsg, crudErrorMessage) {
      // We try to get the error message to the returned http status code
      // If available, use it
      if (errorResponse.status && this.options[errorResponse.status] !== undefined) {
        return this.options[errorResponse.status];
      } // Use the event error message


      if (eventMsg !== null && eventMsg !== undefined) {
        return eventMsg;
      } // If none works, use the default crudErrorMessage


      return crudErrorMessage.replace(':resource', this.vm.resource.$getName());
    }
    /**
     * Run the before proceed optional callback function
     * id the function returns false, stop the flow
     *
     * @param {*} callbackFunc
     * @param {*} reject promise reject pointer
     * @returns boolean
     */

  }, {
    key: "runProceedCallBack",
    value: function runProceedCallBack(callbackFunc, reject, data) {
      var proceed = true;

      if (this.vm.hasOwnProperty(callbackFunc)) {
        proceed = this.vm[callbackFunc](data);
      }

      if (proceed === false) {
        var error = "proceed stopped on ".concat(callbackFunc, " function");
        console.log(error);
        var errorMsg = this.options.operationAborted || this.vm.$t('crud.operationAborted');
        this.vm.showInfo(this.capitalize(errorMsg), {
          mode: 'multi-line'
        }); // In the default CRUD usage, it is not necessary to
        // listen to the promise result
        // if the promise is not being listened
        // it can raise an error when rejected/resolved.
        // This is not a problem!

        reject(error);
      }

      return proceed === true || proceed === null || proceed === undefined;
    }
    /**
     * Run the after optional callback function
     * If the function returns false, stop the flow
     * @param {*} callbackFunc
     * @param {*} data data to be passed
     */

  }, {
    key: "runAfterCallBack",
    value: function runAfterCallBack(callbackFunc, data) {
      if (this.vm.hasOwnProperty(callbackFunc)) {
        this.vm[callbackFunc](data);
      }
    }
    /**
     * Checks whenever the default form $rf exists and if so, if it is valid
     * If invalid, reject the promise and show the invalid form error message
     *
     * @param {*} reject
     * @returns boolean
     */

  }, {
    key: "formIsValid",
    value: function formIsValid(reject) {
      var validForm = true; // init as valid

      var formRef = this.options.formRef || 'form'; // get the form ref (custom or default one)

      var form = this.vm.$refs[formRef] || null; // get the form object using the formRef

      var formHelper = new _formHelper["default"](form, this.vm, this.options);
      validForm = formHelper.validate();

      if (!validForm) {
        var errorMsg = this.options.invalidForm || this.vm.$t('crud.invalidForm'); // In the default CRUD usage, it is not necessary to
        // listen to the promise result
        // if the promise is not being listened
        // it can raise an error when rejected/resolved.
        // This is not a problem!

        reject(errorMsg);
      } // Validate the form


      return validForm;
    }
    /**
     * Capitalize a string
     *
     * @param {*} string
     * @returns String
     */

  }, {
    key: "capitalize",
    value: function capitalize(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    /**
     * Show the response error message or the default error message passed
     * @param {*} errorResponse
     * @param {*} defaultErrorMessage
     */

  }, {
    key: "showErrorMessage",
    value: function showErrorMessage(errorResponse, frontEndErrorMessage) {
      var showError = true; // If the message is set as `false` so we shall not display any message

      if (frontEndErrorMessage === false) {
        showError = false;
      }

      if (this.vm.hasOwnProperty('beforeShowError')) {
        errorResponse.showError = showError; // add the current showError status to the object passed to the call back

        showError = this.vm['beforeShowError'](errorResponse);
      }

      if (showError === true) {
        // As we don't want to show a raw error to the user, if the status code is == 500 (internal server error)
        // or there is no error response we show a friendly error message
        if (errorResponse === undefined || errorResponse.status === 500 || !errorResponse.data || !errorResponse.data.message) {
          // if it this and 500 case, we show only a friendly message, and log the error and log the error
          // as we are not sure about the error message size, use multi-line model for the toaster
          this.vm.showError(this.capitalize(frontEndErrorMessage), {
            mode: 'multi-line'
          });
          console.log(errorResponse);
        } else {
          // Define the error message to be used
          // either the front end message or the server one (if available)
          var errorMsg = frontEndErrorMessage;

          if (!this.options.skipServerMessages) {
            errorMsg = errorResponse.message || errorResponse.data.message;
          } // We show the response error message
          // As we are not sure about the error message size, use multi-line model for the toaster


          this.vm.showError(this.capitalize(errorMsg), {
            mode: 'multi-line'
          });
        }
      }
    }
  }], [{
    key: "set",
    value: function set(vm, modelService, options) {
      return new CRUD(vm, modelService, options);
    }
  }]);

  return CRUD;
}();
/**
 * CRUD data object that must be used to be injected as a collection of
 * data attribute in the vue data section
 */


exports.CRUD = CRUD;

var _initialiseProps = function _initialiseProps() {
  var _this2 = this;

  this.trasnslate = function (key) {
    var error = 'The translate function was not properly passed via options, so a fallback function was used and english as used as default translation.';
    console.error(error);
    return _crudI18n["default"].crud[key] || key;
  };

  this.showSuccess = function (msg, options) {
    console.log(msg, options);
  };

  this.showInfo = function (msg, options) {
    console.info(msg, options);
  };

  this.showError = function (msg, options) {
    console.error(msg, options);
  };

  this.confirmDialog = function (msg, options) {
    var error = 'Confirm dialog function was not properly passed via parameters. Check the console to see more info.';
    console.error(error, msg, options); // as the confirm dialog function was not defined, the action has been cancelled

    return new Promise(function (resolve, reject) {
      reject(error);
    });
  };

  this.index = function (filters) {
    var context = _this2;
    return new Promise(function (resolve, reject) {
      var proceed = context.runProceedCallBack('beforeIndex', reject);

      if (proceed) {
        // in the index action we do not use the resource model instance, but each
        // resource returned will be transformed into an active record instance bt the Model
        // you can skip this by defining the `raw` attribute equal true in the model service
        // @see @/core/model-service and @/core/model to read more
        context.modelService.query(filters).then(function (resources) {
          if (resources.raw && resources.data) {
            resources = resources.data;
          } // Each returned resource, will be, by default an Model (@core/model) instance, that supports instance methods, like $save, $destroy etc


          context.vm.resources = resources; // runs the optional after callback (if the function is defined in the Vue component) an pass the data

          context.runAfterCallBack('afterIndex', _this2.vm.resources); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!

          resolve(resources);
        }, function (errorResponse) {
          // Handle the error response
          context.handleError(errorResponse, context.options.indexFailedMsg, context.vm.$t('crud.failWhileTryingToGetTheResource')); // if it is being run because of a queryOnStartup flag, so we need to tell
          // the client that the crud request is done

          if (context.options.queryOnStartup) {
            context.vm.crudReady = true;
          }
        });
      }
    });
  };

  this.get = function (pkValue) {
    var context = _this2;
    return new Promise(function (resolve, reject) {
      var proceed = context.runProceedCallBack('beforeGet', reject);

      if (proceed) {
        context.modelService.get(pkValue).then(function (resource) {
          // The returned resource, will be, by default an Model (@core/model) instance, that supports instance methods, like $save, $destroy etc
          context.vm.resource = resource; // runs the optional after callback (if the function is defined in the Vue component) an pass the data

          context.runAfterCallBack('afterGet', context.vm.resource); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // context is not a problem!

          resolve(context.vm.resource);
        }, function (errorResponse) {
          // Handle the error response
          context.handleError(errorResponse, context.options.getFailedMsg, context.vm.$t('crud.failWhileTryingToGetTheResource')); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!

          reject(errorResponse);
        });
      }
    });
  };

  this.save = function () {
    var context = _this2; // We return a promise and resolve/reject it because optionally, the developer
    // can have its own save method, and after it is finished do something special

    return new Promise(function (resolve, reject) {
      var validForm = context.formIsValid(reject);
      var proceed = context.runProceedCallBack('beforeSave', reject);

      if (validForm && proceed) {
        var postResource = context.vm.resource.$strip(context.vm.resource);

        if (Object.keys(postResource).length === 0) {
          var msg = context.options.resourceEmptyMsg || context.vm.$t('crud.resourceEmptyMsg').replace(':resource', context.vm.resource.$getName());
          context.vm.showError(context.capitalize(msg), {
            mode: 'multi-line'
          });
          reject(msg);
        } else {
          context.vm.resource.$save().then(function (data) {
            // the return is an object containing a resource/Model instance and a (optional) message property
            context.vm.resource = data.resource; // Define the save confirmation message to be displayed

            var msg = data.message || context.options.savedMsg || context.vm.$t('crud.resourceSaved').replace(':resource', context.vm.resource.$getName()); // Capitalize and use multiline to be sure that the message won be truncated (we don't know the how big the messages from server can be)

            context.vm.showSuccess(context.capitalize(msg), {
              mode: 'multi-line'
            }); // Reload the data listed

            if (!context.options.skipAutoIndexAfterSave && !context.options.skipAutoIndexAfterAllEvents) {
              context.vm.index();
            } // runs the optional after callback (if the function is defined in the Vue component) an pass the data


            context.runAfterCallBack('afterSave', context.vm.resource); // In the default CRUD usage, it is not necessary to
            // listen to the promise result
            // if the promise is not being listened
            // it can raise an error when rejected/resolved.
            // This is not a problem!

            resolve(context.vm.resource);
          }, function (errorResponse) {
            // Handle the error response
            context.handleError(errorResponse, context.options.saveFailedMsg, context.vm.$t('crud.failWhileTryingToSaveResource')); // In the default CRUD usage, it is not necessary to
            // listen to the promise result
            // if the promise is not being listened
            // it can raise an error when rejected/resolved.
            // This is not a problem!

            reject(errorResponse);
          });
        }
      }
    });
  };

  this.update = function () {
    var context = _this2;
    return new Promise(function (resolve, reject) {
      var validForm = context.formIsValid(reject);
      var proceed = context.runProceedCallBack('beforeUpdate', reject);

      if (validForm && proceed) {
        context.vm.resource.$update().then(function (data) {
          // the return is an object containing a resource/Model instance and a (optional) message property
          context.vm.resource = data.resource; // Define the save confirmation message to be displayed

          var msg = data.message || context.options.updatedMsg || context.vm.$t('crud.resourceUpdated').replace(':resource', context.vm.resource.$getName()); // Capitalize and use multiline to be sure that the message won be truncated (we don't know the how big the messages from server can be)

          context.vm.showSuccess(context.capitalize(msg), {
            mode: 'multi-line'
          }); // Reload the data listed

          if (!context.options.skipAutoIndexAfterUpdate && !context.options.skipAutoIndexAfterAllEvents) {
            context.vm.index();
          } // runs the optional after callback (if the function is defined in the Vue component) an pass the data


          context.runAfterCallBack('afterUpdate', context.vm.resource); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!

          resolve(context.vm.resource);
        }, function (errorResponse) {
          // Handle the error response
          context.handleError(errorResponse, context.options.updateFailedMsg, context.vm.$t('crud.failWhileTryingToUpdateResource')); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!

          reject(errorResponse);
        });
      }
    });
  };

  this.confirmAndDestroy = function (resource) {
    var context = _this2;
    return new Promise(function (resolve, reject) {
      // Define the conformation modal title to be displayed before destroying
      var confirmTitle = context.options.confirmDestroyTitle || context.vm.$t('crud.removalConfirmTitle'); // Define the conformation modal text to be displayed before destroying

      var confirmMessage = context.options.confirmDestroyText || context.vm.$t('crud.doYouReallyWantToRemove').replace(':resource', context.vm.resource.$getName()); // Open the confirmation modal and wait for the response in a promise

      context.vm.confirmDialog(confirmTitle, confirmMessage).then(function () {
        // if the user confirms the destroy, run it
        context.vm.destroy(resource).then( // In the default CRUD usage, it is not necessary to
        // listen to the promise result
        // if the promise is not being listened
        // it can raise an error when rejected/resolved.
        // This is not a problem!
        resolve, reject);
      }, function (error) {
        // If the user has clicked `no` in the dialog, abort the destroy and show an aborted message
        // Define the error message to be displayed
        var msg = context.options.destroyAbortedMsg || context.vm.$t('crud.destroyAborted'); // show the abort message as an info

        context.vm.showInfo(msg); // In the default CRUD usage, it is not necessary to
        // listen to the promise result
        // if the promise is not being listened
        // it can raise an error when rejected/resolved.
        // This is not a problem!

        reject(error);
      });
    });
  };

  this.destroy = function (resource) {
    var context = _this2;
    return new Promise(function (resolve, reject) {
      var proceed = context.runProceedCallBack('beforeDestroy', reject);

      if (proceed) {
        resource.$destroy().then(function (data) {
          // Define the save confirmation message to be displayed
          var msg = data.message || context.options.destroyedMsg || context.vm.$t('crud.resourceDestroyed').replace(':resource', context.vm.resource.$getName()); // Capitalize and use multiline to be sure that the message won be truncated (we don't know the how big the messages from server can be)

          context.vm.showSuccess(context.capitalize(msg), {
            mode: 'multi-line'
          }); // Reload the data listed

          if (!context.options.skipAutoIndexAfterDestroy && !context.options.skipAutoIndexAfterAllEvents) {
            context.vm.index();
          } // runs the optional after callback (if the function is defined in the Vue component) an pass the data


          context.runAfterCallBack('afterDestroy', resource); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!

          resolve();
        }, function (errorResponse) {
          // Handle the error response
          context.handleError(errorResponse, context.options.destroyFailedMsg, context.vm.$t('crud.failWhileTryingToDestroyResource')); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!

          reject(errorResponse);
        });
      }
    });
  };
};

var CRUDData = {
  resource: null,
  resources: [],
  crudReady: false,
  modelService: null
}; // Export the CRUD and the CRUDData objects

exports.CRUDData = CRUDData;

},{"./form-helper":29,"./i18n/crud.i18n.en":30}],28:[function(require,module,exports){
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
 * @param {Object} optionsFunctions - object containing:
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

    _this.options.isAuthenticated = _this.options.isAuthenticated || function () {
      return false;
    };

    _this.options.getBearerToken = _this.options.getBearerToken || function () {
      return null;
    };

    _this.options.geLocale = _this.options.geLocale || function () {
      return null;
    };

    _this.options.getVueInstance = _this.options.getVueInstance || function () {
      return console.error('the vue instance getting function was not defined');
    };

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

},{"axios":1}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var CrudForm = /*#__PURE__*/function () {
  function CrudForm(formRef, context, options) {
    _classCallCheck(this, CrudForm);

    this.formRef = formRef;
    this.vm = context;
    this.options = options || {};
  }
  /**
   * Validate a form by running the default form validate and addition check for required field
   * If any field is invalid, sets the field as invalid, set it error message and shows a toaster with the error
   */


  _createClass(CrudForm, [{
    key: "validate",
    value: function validate() {
      if (this.options.skipFormValidation) {
        return true;
      }

      var validForm = this.formRef.validate(); // Validate the native `required` input attribute
      // that is not validated by the form.validate()

      if (!this.validateRequiredFields()) {
        validForm = false;
      }

      if (!validForm && !this.options.skipShowValidationMsg) {
        var errorMsg = this.options.invalidForm || this.vm.$t('crud.invalidForm'); // as we are not sure about the error message size, use multi-line model for the toaster

        this.vm.showError(this.capitalize(errorMsg), {
          mode: 'multi-line'
        });
      }

      return validForm;
    }
    /**
     * Validate the required input attribute
     *
     * @param {Object} form
     * @returns {Boolean}
     * @memberof CrudForm
     */

  }, {
    key: "validateRequiredFields",
    value: function validateRequiredFields() {
      var _this = this;

      var validForm = true;
      this.getInputs(this.formRef).forEach(function (input) {
        // We only validate the  required attribute if the input is not yet invalid
        if (input.valid && input.required && (input.inputValue === undefined || input.inputValue === null || input.inputValue === '')) {
          input.valid = validForm = false;

          var errorMsg = "".concat(input.label, " ").concat(_this.vm.$t('crud.required')) || _this.vm.$t('crud.inputRequired');

          input.errorBucket.push(errorMsg);
        }
      });
      return validForm;
    }
    /**
     * Retrieve all the form inputs
     *
     * @param {*} form
     * @returns Array
     * @memberof CrudForm
     */

  }, {
    key: "getInputs",
    value: function getInputs(form) {
      var results = [];

      var search = function search(children) {
        var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        for (var index = 0; index < children.length; index++) {
          var child = children[index];

          if (child.errorBucket !== undefined) {
            results.push(child);
          } else {
            search(child.$children, depth + 1);
          }
        }

        if (depth === 0) return results;
      };

      return search(form.$children);
    }
    /**
     * Capitalize a string
     *
     * @param {*} string
     * @returns String
     */

  }, {
    key: "capitalize",
    value: function capitalize(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  }]);

  return CrudForm;
}();

var _default = CrudForm;
exports["default"] = _default;

},{}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _default = {
  crud: {
    failWhileTryingToGetTheResource: 'It was not possible to get the :resource(s)',
    failWhileTryingToSaveResource: 'It was not possible to save the :resource',
    failWhileTryingToUpdateResource: 'It was not possible to update the :resource',
    failWhileTryingToDestroyResource: 'It was not possible to remove the :resource',
    resourceSaved: ':resource saved successfully',
    resourceDestroyed: ':resource removed successfully',
    resourceUpdated: ':resource updated successfully',
    removalConfirmTitle: 'Confirm removal',
    doYouReallyWantToRemove: 'Do you really want to remove this :resource?',
    destroyAborted: 'Removal aborted',
    resourceEmptyMsg: 'The :resource is empty. It is not possible to save it',
    invalidForm: 'Some form fields are invalid. Please check it out',
    operationAborted: 'Operation aborted',
    inputRequired: 'Input required',
    required: 'required'
  }
};
exports["default"] = _default;

},{}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "CrudHttpApi", {
  enumerable: true,
  get: function get() {
    return _crudHttpApi["default"];
  }
});
Object.defineProperty(exports, "CRUDController", {
  enumerable: true,
  get: function get() {
    return _crudController["default"];
  }
});
Object.defineProperty(exports, "FormHelper", {
  enumerable: true,
  get: function get() {
    return _formHelper["default"];
  }
});
Object.defineProperty(exports, "ModelService", {
  enumerable: true,
  get: function get() {
    return _modelService["default"];
  }
});
Object.defineProperty(exports, "Model", {
  enumerable: true,
  get: function get() {
    return _model["default"];
  }
});

var _crudHttpApi = _interopRequireDefault(require("./crud-http-api.js"));

var _crudController = _interopRequireDefault(require("./crud-controller.js"));

var _formHelper = _interopRequireDefault(require("./form-helper.js"));

var _modelService = _interopRequireDefault(require("./model-service.js"));

var _model = _interopRequireDefault(require("./model.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var VueRestCrud = {
  CrudHttpApi: _crudHttpApi["default"],
  CRUD: _crudController["default"],
  FormHelper: _formHelper["default"],
  ModelService: _modelService["default"],
  Model: _model["default"]
}; // Define VueRestCrud for Node module pattern loaders, including Browserify

if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === 'object' && _typeof(module.exports) === 'object') {
  module.exports = VueRestCrud; // define VueRestCrud as an AMD module
  // eslint-disable-next-line no-undef
} else if (typeof define === 'function' && define.amd) {
  // eslint-disable-next-line no-undef
  define(VueRestCrud);
}

if (typeof window !== 'undefined') {
  window.VueRestCrud = VueRestCrud;
}

},{"./crud-controller.js":27,"./crud-http-api.js":28,"./form-helper.js":29,"./model-service.js":32,"./model.js":33}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _crudHttpApi = _interopRequireDefault(require("./crud-http-api"));

var _model = _interopRequireDefault(require("./model"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Model service class that allows the running of REST api actions in a remote server for a defined endpoint resource.
 * It is intended to be used in conjunction with the Model class @see @/core/model to read more
 *
 * @param {*} endPoint the relative url of the resource
 * @param {*} resourceName the resource name (used to build the default confirmation messages)
 * @param {*} options optional options that allows to customize the model service behavior
 * @author <amoncaldas@gmail.com> Amon santana
 *
 * The options object may contain the following attributes:
 * - transformRequest (function): executed before the request is made. Useful to change data in special circumstances.
 *    This function will receive an object with the endpoint and filters (when available) attributes. It is not intended to replace the axios
 *    request interceptor!
 * - transformResponse (function): executed after the request is made, passing the original response object received.
 *    Useful if it necessary to modify the data returned before transforming them in a Model instance
 * - raw (boolean): defines if the default transformation of the results into Model instances must be skipped.
 *    If it is true, the active record will not work with the returned items. Useful when you just want to get data, and not destroy/update them
 * - pk (string): overwrites the default primary key attribute, that is 'id'. Use it if your model on the remote server uses a different field as primary key
*/
function ModelService(endPoint, resourceName, options) {
  var _this = this;

  // if options is not passed, initialize it
  options = options || {};
  this.endPoint = endPoint;
  this.endPointTemplate = endPoint;
  this.resourceName = resourceName;
  this.options = options;
  var crudHttp = new _crudHttpApi["default"](options.http);
  this.httpApi = crudHttp.http;
  /**
   * Provides an accessor to get the name of the resource
   */

  this.getName = function () {
    return resourceName;
  };
  /**
   * Clone the current model service
   * @returns {ModelService} service
   */


  this.clone = function () {
    var service = new ModelService(_this.endPoint, _this.resourceName, _this.options);
    return service;
  };
  /**
   * Provides an accessor to get the endpoint
   * @param String append
   * @param String prepend
   */


  this.getEndPoint = function (append, prepend) {
    var baseEndPoint = _this.endPoint;

    if (append) {
      baseEndPoint = "".concat(baseEndPoint, "/").concat(append);
    }

    if (prepend) {
      baseEndPoint = "".concat(prepend, "/").concat(baseEndPoint);
    }

    return baseEndPoint;
  };
  /**
   * Provides an accessor to get the endpoint template
   * @param String append
   * @param String prepend
   */


  this.getEndPointTemplate = function () {
    return _this.endPointTemplate;
  };
  /**
   * Provides an accessor to set the endpoint
   * @param String endPoint
   */


  this.setEndPoint = function (endPoint) {
    _this.endPoint = endPoint;
  };
  /**
   * Queries the model service endpoint, retrieve the resources and (by default) transform them in active record Models
   * @param {*} filters  filters to be applied to retrieve the resources
   */


  this.query = function (filters) {
    var endpointAppend = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    var http = _this.httpApi;
    return new Promise(function (resolve, reject) {
      var endPoint = _this.endPoint + endpointAppend;
      endPoint += _this.buildParams(filters);
      var request = {
        endPoint: endPoint,
        filters: filters,
        running: 'query'
      }; // if the transform request is defined, run it

      if (options.transformRequest) {
        options.transformRequest(request);
      } // run the get action using the http client


      http.get(request.endPoint, request.filters).then(function (response) {
        // add the filters applied to the response so it can be used in some business logic
        response.filtersApplied = filters; // if the transform response is defined, run it

        if (options.transformResponse) {
          options.transformResponse(response);
        } // if the raw option is defined, skip the transformation to Model and resolve the promise


        if (options.raw === true) {
          response.raw = true;
          resolve(response);
        } else {
          // transform each resource returned in a active record Model
          // @see @/core/model to read more
          var items = modelCollection(response.data, _this);
          resolve(items);
        }
      }, function (error) {
        reject(error);
      })["catch"](function (error) {
        reject(error);
      });
    });
  };
  /**
   * Queries the model service endpoint, retrieve the resources and (by default) transform them in active record Models
   * @param {*} customOptions  options to be applied to the request. The following options attributes can defined:
   *  - query (object): containing key -> value attributes to be used as query string)
   *  - data (object): containing key -> value attributes to be used as post data)
   *  - verb (string): verb to be used - default is 'get'
   *  - transformRequest: function to be called back on transformRequest event
   * @param {*} endPoint  the endpoint to which the request will be made
   */


  this.customQuery = function (customOptions, endPoint) {
    var cOptions = customOptions || options; // set the raw option

    cOptions.raw = cOptions.raw === undefined ? options.raw : cOptions.raw;
    var http = _this.httpApi;
    return new Promise(function (resolve, reject) {
      endPoint = endPoint || _this.getEndPoint();
      var request = {
        endPoint: endPoint,
        query: cOptions.query,
        running: 'customQuery',
        data: cOptions.data
      };
      request.endPoint += _this.buildParams(request.query); // set the verb (from options or default)

      request.verb = cOptions.verb || 'get'; // if the transform request is defined, run it

      if (cOptions.transformRequest) {
        options.transformRequest(request);
      } // run the get action using the http client


      http[request.verb](request.endPoint, request.data).then(function (response) {
        // if the transform response is defined, run it
        if (cOptions.transformResponse) {
          options.transformResponse(response);
        } // if the raw option is defined, skip the transformation to Model and resolve the promise


        if (cOptions.raw === true) {
          if (_typeof(response.data) === 'object') {
            response.data.httpStatusCode = response.status;
          }

          response.raw = true;
          resolve(response.data);
        } else {
          // transform each resource returned in a active record Model
          // @see @/core/model to read more
          var items = modelCollection(response.data, _this);
          resolve(items);
        }
      }, function (error) {
        reject(error);
      })["catch"](function (error) {
        reject(error);
      });
    });
  };
  /**
   * Retrieve a single specified resource from the service endpoint
   * @param string|numeric id
   */


  this.get = function (pkValue) {
    var http = _this.httpApi;
    return new Promise(function (resolve, reject) {
      var endPoint = "".concat(_this.endPoint, "/").concat(pkValue);
      var request = {
        endPoint: endPoint,
        running: 'get'
      }; // if the transform request is defined, run it

      if (options.transformRequest) {
        options.transformRequest(request);
      }

      http.get(request.endPoint).then(function (response) {
        // add the pkValue used to the response so it can be used in some business logic
        response.pkValue = pkValue; // if the transform response is defined, run it

        if (options.transformResponse) {
          options.transformResponse(response);
        }

        if (options.raw === true) {
          response.raw = true;
          resolve(response.data);
        } else {
          // transform the resource returned in a active record Model
          // @see @/core/model to read more
          var model = new _model["default"](response.data, _this.endPoint, _this.resourceName, _this.options);
          resolve(model);
        }
      }, function (error) {
        reject(error);
      })["catch"](function (error) {
        reject(error);
      });
    });
  };
  /**
   * Build url params based in an object
   * @param {*} obj
   */


  this.buildParams = function (obj) {
    if (obj === undefined || obj === null) {
      return '';
    }

    var str = Object.keys(obj).map(function (key) {
      return key + '=' + obj[key];
    }).join('&');

    if (str && str.length > 0) {
      str = '?' + str;
    }

    return str;
  };
  /**
   * Create a new active record Model instance using a 
   * raw object and the model service configuration.
   * @param {Object} rawObject
   * @returns Model
   */


  this.newModelInstance = function () {
    var rawObject = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    return new _model["default"](rawObject, _this.endPoint, _this.resourceName, _this.options);
  };

  return this;
}
/**
 * Transform the raw returned data in a active record Model
 * @param {*} rawObj
 * @param {*} arrayInst
 * @param {*} context
 */


var wrapAsNewModelInstance = function wrapAsNewModelInstance(rawObj, arrayInst, context) {
  // create an instance
  var instance = rawObj.constructor === _model["default"] ? rawObj : new _model["default"](rawObj, context.endPoint, context.resourceName, context.options); // set a pointer to the array

  instance.$$array = arrayInst;
  return instance;
};
/**
 * Transform the raw returned data collection in a array of active record Models
 * @param {*} value
 * @param {*} context
 */


var modelCollection = function modelCollection(value, context) {
  value = Array.isArray(value) ? value : []; // Transform each value item in a Model object with active record strategy

  value.forEach(function (v, i) {
    // this should not happen but prevent blow up
    if (v === null || v === undefined) return; // reset to new instance

    value[i] = wrapAsNewModelInstance(v, value, context);
  });
  return value;
}; // export the model Service class


var _default = ModelService;
exports["default"] = _default;

},{"./crud-http-api":28,"./model":33}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _crudHttpApi = _interopRequireDefault(require("./crud-http-api"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * Model class that acts as an active record representation of the resource in a remote server
 * @param {*} value initial value
 * @param {*} endPoint relative url of the endpoint
 * @param {*} resourceName resource name
 * @param {*} options optional parameters object to customize the Model class behavior
 * - sendEmptyAttributes: tells the clean process to send resource attributes with empty values
 * - pk: defines a custom primary key attribute. the default is `id`
 * - transformRequest (function): executed before the request is made. Useful to change data in special circumstances.
 *   This function will receive an object with the endpoint and filters (when available) attributes. It is not intended to replace the axios
 *   request interceptor!
 * - transformResponse (function): executed after the request is made, passing the original response object received.
 */
var Model = /*#__PURE__*/function () {
  /**
   *Creates an instance of Model.
   * @param {*} value
   * @param {*} endPoint
   * @param {*} resourceName
   * @param {*} options
   * @returns {Model}
   */
  function Model(value, endPoint, resourceName, options) {
    _classCallCheck(this, Model);

    _initialiseProps.call(this);

    this.$options = options;
    this.$endPoint = endPoint;
    this.$name = resourceName;
    var crudApi = new _crudHttpApi["default"](options.http);
    this.$http = crudApi.http; // If the value is undefined, create a empty obj

    value = value || {}; // Transform the empty Model object in a Model with values (active record)

    this.$extend(this, value);
    /**
     * Instance function and attributes that must be removed before sending to the remote server
     */

    this.$instanceKeywords = ['$extend', '$save', '$post', '$destroy', '$pending', '$update', '$copy', '$getName', '$strip', '$options', '$name', '$endPoint', '$create', '$setEndpoint', '$clean', '$parseRequest', '$instanceKeywords', '$http'];
  }
  /**
   * Get the model nice name
   *
   * @memberof Model
   */


  _createClass(Model, [{
    key: "$extend",

    /**
     * Extends a resource object based in a value object
     * @param {*} instance
     * @param {*} value
     */
    value: function $extend(instance, value) {
      if (_typeof(value) === 'object') {
        for (var key in value) {
          // Check also if property is not inherited from prototype
          if (value.hasOwnProperty(key)) {
            instance[key] = value[key];
          }
        }
      }
    }
    /**
     * Extends a resource object based in a value object
     * @param {*} instance
     * @param {*} value
     */

  }]);

  return Model;
}();

var _initialiseProps = function _initialiseProps() {
  var _this = this;

  this.$getName = function () {
    return _this.$name;
  };

  this.$setEndpoint = function (value) {
    _this.$endPoint = value;
  };

  this.$copy = function () {
    var copied = {};

    for (var key in _this) {
      // Check also if property is not inherited from prototype
      if (_this.hasOwnProperty(key)) {
        copied[key] = _this[key];
      }
    }

    return copied;
  };

  this.$save = function () {
    var pk = _this.$options.pk || 'id';

    if (_this[pk] && _this[pk] !== false && _this[pk] !== '') {
      return _this.$update();
    } else {
      // If it is a create new resource
      return _this.$create();
    }
  };

  this.$post = function (request) {
    request = _this.$parseRequest(request);
    var instance = _this;
    instance.$pending = true;
    return new Promise(function (resolve, reject) {
      if (instance.$options.transformRequest) {
        instance.$options.transformRequest(request);
      }

      instance.$http.post(request.endPoint, request.resource).then(function (response) {
        instance.$pending = false;

        if (instance.$options.transformResponse) {
          instance.$options.transformResponse(response);
        } // Extend the value from the server to me


        if (response.data) {
          instance.$extend(instance, response.data);
        }

        var data = {
          resource: instance,
          message: response.data.message
        };
        resolve(data);
      })["catch"](function (error) {
        instance.$pending = true;
        console.log(error);
        reject(error);
      });
    });
  };

  this.$parseRequest = function (request) {
    request = request || {};

    if (!request.endPoint && request.endPointAppend) {
      request.endPoint = _this.$endPoint + request.endPointAppend;
    }

    if (!request.resource) {
      request.resource = _this.$clean(_this);
    }

    return request;
  };

  this.$create = function () {
    var request = {
      endPoint: _this.$endPoint,
      filters: {},
      resource: _this.$clean(_this),
      running: 'create'
    }; // $post will return a promise

    return _this.$post(request);
  };

  this.$destroy = function () {
    var request = {
      endPoint: _this.$endPoint,
      filters: {},
      resource: _this.$clean(_this),
      running: 'destroy'
    };

    if (_this.$options.transformRequest) {
      _this.$options.transformRequest(request);
    }

    var pk = _this.$options.pk || 'id';
    var destroyEndPoint = "".concat(request.endPoint, "/").concat(request.resource[pk]);
    var instance = _this;
    return new Promise(function (resolve, reject) {
      instance.$http["delete"](destroyEndPoint).then(function (response) {
        var data = {
          resource: null,
          message: response.data.message
        };
        resolve(data);
      })["catch"](function (error) {
        reject(error);
      });
    });
  };

  this.$update = function () {
    var instance = _this;
    var request = {
      endPoint: _this.$endPoint,
      filters: {},
      resource: _this.$clean(instance),
      running: 'update'
    };

    if (instance.$options.transformRequest) {
      instance.$options.transformRequest(request);
    }

    var pk = instance.$options.pk || 'id';
    var updateEndPoint = "".concat(request.endPoint, "/").concat(request.resource[pk]);
    return new Promise(function (resolve, reject) {
      instance.$http.put(updateEndPoint, request.resource).then(function (response) {
        if (instance.$options.transformResponse) {
          instance.$options.transformResponse(response);
        }

        if (response.data) {
          instance.$extend(instance, response.data);
        }

        var data = {
          resource: _this,
          message: response.data.message
        };
        resolve(data);
      })["catch"](function (error) {
        reject(error);
      });
    });
  };

  this.$strip = function (resource) {
    var shallow = _this.$copy(resource);

    if (shallow && _typeof(shallow) === 'object') {
      for (var key in shallow) {
        // check also if property is not inherited from prototype
        if (shallow.hasOwnProperty(key)) {
          if (_this.$instanceKeywords.indexOf(key) > -1) {
            delete shallow[key];
          }
        }
      }
    }

    return shallow;
  };

  this.$clean = function (resource) {
    var shallow = _this.$strip(resource);

    if (shallow && _typeof(shallow) === 'object') {
      for (var key in shallow) {
        // check also if property is not inherited from prototype
        if (shallow.hasOwnProperty(key)) {
          if (shallow[key] === '' && !_this.$options.sendEmptyAttributes) {
            delete shallow[key];
          }
        }
      }
    }

    return shallow;
  };
};

var _default = Model;
exports["default"] = _default;

},{"./crud-http-api":28}]},{},[31]);
