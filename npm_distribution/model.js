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