"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _httpClient = _interopRequireDefault(require("./http-client"));

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
  var httpClient = new _httpClient["default"](options.httpClientOptions);
  this.httpClient = httpClient.http;
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
    var http = _this.httpClient;
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
    var http = _this.httpClient;
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
    var http = _this.httpClient;
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
 * Transform the raw returned data into an active record Model
 * @param {*} rawObj
 * @param {*} arrayInst
 * @param {*} context
 */


var wrapAsNewModelInstance = function wrapAsNewModelInstance(rawObj, arrayInst, context) {
  // create an instance
  var instance = rawObj.constructor === _model["default"] ? rawObj : new _model["default"](rawObj, context.endPoint, context.resourceName, context.options); // Set a pointer to the array

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