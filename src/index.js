import CrudHttpApi from './crud-http-api.js'
import CRUDController from './crud-controller.js'
import FormHelper from './form-helper.js'
import ModelService from './model-service.js'
import Model from './model.js'

const VueRestCrud = {
  CrudHttpApi: CrudHttpApi,
  CRUD: CRUDController,
  FormHelper: FormHelper,
  ModelService: ModelService,
  Model: Model
}

// Define VueRestCrud for Node module pattern loaders, including Browserify
if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = Openrouteservice
  // define VueRestCrud as an AMD module
  // eslint-disable-next-line no-undef
} else if (typeof define === 'function' && define.amd) {
  // eslint-disable-next-line no-undef
  define(VueRestCrud)
}

if (typeof window !== 'undefined') {
  window.VueRestCrud = VueRestCrud
}

export {CrudHttpApi}
export {CRUDController}
export {FormHelper}
export {ModelService}
export {Model}


