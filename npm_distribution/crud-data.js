"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

/**
 * CRUD data object that must be used to be injected as a collection of
 * data attribute in the vue data section
 */
var CRUDData = {
  resource: null,
  resources: [],
  crudReady: false,
  modelService: null
}; // Export the CRUD and the CRUDData objects

var _default = CRUDData;
exports["default"] = _default;