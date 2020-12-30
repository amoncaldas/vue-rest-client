"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "HttpClient", {
  enumerable: true,
  get: function get() {
    return _httpClient["default"];
  }
});
Object.defineProperty(exports, "Controller", {
  enumerable: true,
  get: function get() {
    return _crudController["default"];
  }
});
Object.defineProperty(exports, "CrudData", {
  enumerable: true,
  get: function get() {
    return _crudData["default"];
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

var _httpClient = _interopRequireDefault(require("./http-client.js"));

var _crudController = _interopRequireDefault(require("./crud-controller.js"));

var _crudData = _interopRequireDefault(require("./crud-data.js"));

var _formHelper = _interopRequireDefault(require("./form-helper.js"));

var _modelService = _interopRequireDefault(require("./model-service.js"));

var _model = _interopRequireDefault(require("./model.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var VueRestClient = {
  HttpClient: _httpClient["default"],
  Controller: _crudController["default"],
  CrudData: _crudData["default"],
  FormHelper: _formHelper["default"],
  ModelService: _modelService["default"],
  Model: _model["default"]
}; // Define VueRestClient for Node module pattern loaders, including Browserify

if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === 'object' && _typeof(module.exports) === 'object') {
  module.exports = VueRestClient; // define VueRestClient as an AMD module
  // eslint-disable-next-line no-undef
} else if (typeof define === 'function' && define.amd) {
  // eslint-disable-next-line no-undef
  define(VueRestClient);
}

if (typeof window !== 'undefined') {
  window.VueRestClient = VueRestClient;
}