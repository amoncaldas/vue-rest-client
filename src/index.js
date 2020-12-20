import CrudHttpApi from './crud-http-api.js'
import CRUDController from './crud-controller.js'
import CrudForm from './form.js'
import ModelService from './model-service.js'
import Model from './model.js'

const VueRestCrud = {
  CrudHttpApi: CrudHttpApi,
  CRUD: CRUDController,
  CrudForm: CrudForm,
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

export default VueRestCrud
