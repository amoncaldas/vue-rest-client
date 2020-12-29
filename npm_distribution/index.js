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
  module.exports = Openrouteservice; // define VueRestCrud as an AMD module
  // eslint-disable-next-line no-undef
} else if (typeof define === 'function' && define.amd) {
  // eslint-disable-next-line no-undef
  define(VueRestCrud);
}

if (typeof window !== 'undefined') {
  window.VueRestCrud = VueRestCrud;
}