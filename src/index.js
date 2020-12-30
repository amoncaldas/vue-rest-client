import HttpClient from './http-client.js'
import Controller from './crud-controller.js'
import CrudData from './crud-data.js'
import FormHelper from './form-helper.js'
import ModelService from './model-service.js'
import Model from './model.js'

const VueRestClient = {
  HttpClient: HttpClient,
  Controller: Controller,
  CrudData: CrudData,
  FormHelper: FormHelper,
  ModelService: ModelService,
  Model: Model
}

// Define VueRestClient for Node module pattern loaders, including Browserify
if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = VueRestClient
  // define VueRestClient as an AMD module
  // eslint-disable-next-line no-undef
} else if (typeof define === 'function' && define.amd) {
  // eslint-disable-next-line no-undef
  define(VueRestClient)
}

if (typeof window !== 'undefined') {
  window.VueRestClient = VueRestClient
}

export {HttpClient}
export {Controller}
export {CrudData}
export {FormHelper}
export {ModelService}
export {Model}


