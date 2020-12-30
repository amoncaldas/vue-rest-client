import HttpClient from './http-client'
import Model from './model'

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
function ModelService (endPoint, resourceName, options) {
  // if options is not passed, initialize it
  options = options || {}

  this.endPoint = endPoint
  this.endPointTemplate = endPoint
  this.resourceName = resourceName
  this.options = options
  let httpClient = new HttpClient(options.httpClientOptions)
  this.httpClient = httpClient.http

  /**
   * Provides an accessor to get the name of the resource
   */
  this.getName = () => {
    return resourceName
  }
  /**
   * Clone the current model service
   * @returns {ModelService} service
   */
  this.clone = () => {
    const service = new ModelService(this.endPoint, this.resourceName, this.options)
    return service
  }

  /**
   * Provides an accessor to get the endpoint
   * @param String append
   * @param String prepend
   */
  this.getEndPoint = (append, prepend) => {
    let baseEndPoint = this.endPoint
    if (append) {
      baseEndPoint = `${baseEndPoint}/${append}`
    }
    if (prepend) {
      baseEndPoint = `${prepend}/${baseEndPoint}`
    }
    return baseEndPoint
  }

  /**
   * Provides an accessor to get the endpoint template
   * @param String append
   * @param String prepend
   */
  this.getEndPointTemplate = () => {
    return this.endPointTemplate
  }

  /**
   * Provides an accessor to set the endpoint
   * @param String endPoint
   */
  this.setEndPoint = (endPoint) => {
    this.endPoint = endPoint
  }

  /**
   * Queries the model service endpoint, retrieve the resources and (by default) transform them in active record Models
   * @param {*} filters  filters to be applied to retrieve the resources
   */
  this.query = (filters, endpointAppend = '') => {
    let http = this.httpClient
    return new Promise((resolve, reject) => {
      let endPoint = this.endPoint + endpointAppend
      endPoint += this.buildParams(filters)
      let request = { endPoint: endPoint, filters: filters, running: 'query' }

      // if the transform request is defined, run it
      if (options.transformRequest) {
        options.transformRequest(request)
      }
      // run the get action using the http client
      http.get(request.endPoint, request.filters).then(response => {
        // add the filters applied to the response so it can be used in some business logic
        response.filtersApplied = filters

        // if the transform response is defined, run it
        if (options.transformResponse) {
          options.transformResponse(response)
        }
        // if the raw option is defined, skip the transformation to Model and resolve the promise
        if (options.raw === true) {
          response.raw = true
          resolve(response)
        } else {
          // transform each resource returned in a active record Model
          // @see @/core/model to read more
          let items = modelCollection(response.data, this)
          resolve(items)
        }
      },
      error => {
        reject(error)
      })
      .catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Queries the model service endpoint, retrieve the resources and (by default) transform them in active record Models
   * @param {*} customOptions  options to be applied to the request. The following options attributes can defined:
   *  - query (object): containing key -> value attributes to be used as query string)
   *  - data (object): containing key -> value attributes to be used as post data)
   *  - verb (string): verb to be used - default is 'get'
   *  - transformRequest: function to be called back on transformRequest event
   * @param {*} endPoint  the endpoint to which the request will be made
   */
  this.customQuery = (customOptions, endPoint) => {
    let cOptions = customOptions || options

    // set the raw option
    cOptions.raw = cOptions.raw === undefined ? options.raw : cOptions.raw

    let http = this.httpClient
    return new Promise((resolve, reject) => {
      endPoint = endPoint || this.getEndPoint()

      let request = {endPoint: endPoint, query: cOptions.query, running: 'customQuery', data: cOptions.data}

      request.endPoint += this.buildParams(request.query)

      // set the verb (from options or default)
      request.verb = cOptions.verb || 'get'

       // if the transform request is defined, run it
      if (cOptions.transformRequest) {
        options.transformRequest(request)
      }

      // run the get action using the http client
      http[request.verb](request.endPoint, request.data).then(response => {
        // if the transform response is defined, run it
        if (cOptions.transformResponse) {
          options.transformResponse(response)
        }

        // if the raw option is defined, skip the transformation to Model and resolve the promise
        if (cOptions.raw === true) {
          if (typeof response.data === 'object') {
            response.data.httpStatusCode = response.status
          }
          response.raw = true
          resolve(response.data)
        } else {
          // transform each resource returned in a active record Model
          // @see @/core/model to read more
          let items = modelCollection(response.data, this)
          resolve(items)
        }
      },
      error => {
        reject(error)
      })
      .catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Retrieve a single specified resource from the service endpoint
   * @param string|numeric id
   */
  this.get = (pkValue) => {
    let http = this.httpClient
    return new Promise((resolve, reject) => {
      let endPoint = `${this.endPoint}/${pkValue}`

      let request = { endPoint: endPoint, running: 'get' }

      // if the transform request is defined, run it
      if (options.transformRequest) {
        options.transformRequest(request)
      }

      http.get(request.endPoint).then(response => {
        // add the pkValue used to the response so it can be used in some business logic
        response.pkValue = pkValue

        // if the transform response is defined, run it
        if (options.transformResponse) {
          options.transformResponse(response)
        }

        if (options.raw === true) {
          response.raw = true
          resolve(response.data)
        } else {
          // transform the resource returned in a active record Model
          // @see @/core/model to read more
          let model = new Model(response.data, this.endPoint, this.resourceName, this.options)
          resolve(model)
        }
      },
      error => {
        reject(error)
      })
      .catch(error => {
        reject(error)
      })
    })
  }

  /**
   * Build url params based in an object
   * @param {*} obj
   */
  this.buildParams = (obj) => {
    if (obj === undefined || obj === null) {
      return ''
    }
    let str = Object.keys(obj).map((key) => {
      return key + '=' + obj[key]
    }).join('&')
    if (str && str.length > 0) {
      str = '?' + str
    }
    return str
  }

  /**
   * Create a new active record Model instance using a 
   * raw object and the model service configuration.
   * @param {Object} rawObject
   * @returns Model
   */
  this.newModelInstance = (rawObject = null) => {
    return new Model(rawObject, this.endPoint, this.resourceName, this.options)
  }

  return this
}

/**
 * Transform the raw returned data into an active record Model
 * @param {*} rawObj
 * @param {*} arrayInst
 * @param {*} context
 */
const wrapAsNewModelInstance = (rawObj, arrayInst, context) => {
  // create an instance
  var instance = rawObj.constructor === Model ? rawObj : new Model(rawObj, context.endPoint, context.resourceName, context.options)

  // Set a pointer to the array
  instance.$$array = arrayInst

  return instance
}

/**
 * Transform the raw returned data collection in a array of active record Models
 * @param {*} value
 * @param {*} context
 */
const modelCollection = (value, context) => {
  value = Array.isArray(value) ? value : []

  // Transform each value item in a Model object with active record strategy
  value.forEach((v, i) => {
    // this should not happen but prevent blow up
    if (v === null || v === undefined) return
    // reset to new instance
    value[i] = wrapAsNewModelInstance(v, value, context)
  })
  return value
}

// export the model Service class
export default ModelService
