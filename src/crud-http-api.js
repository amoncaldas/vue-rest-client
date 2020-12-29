import axios from 'axios'

class CrudHttp {
  /**
   * Build and cofigure the http client instance
   * @param {Object} vueInstance
   * @param {Object} options - object containing:
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
  constructor (options = {}) {
    this.options = options
    this.setDefaultOptions()

    // Build an axios object
    const httpApi = axios.create({
      baseURL: options.baseURL,
      headers: {}
    })
    httpApi.interceptors.request.use(this.requestInterceptors)
    httpApi.interceptors.response.use(this.responseInterceptors, this.responseErrorInterceptors)
    this.http = httpApi
  }

  /**
   * Set default options
   */
  setDefaultOptions = () => {
    this.options.baseURL = this.options.baseURL || ''
    this.options.showLoadingEventName = this.options.showLoadingEventName || 'showLoading'
    
    if(typeof this.options.isAuthenticated !== "function"){
      this.options.isAuthenticated = function () { return false }
    } 

    if(typeof this.options.getBearerToken !== "function"){
      this.options.getBearerToken = function () { return null }
    }    

    if(typeof this.options.geLocale !== "function"){
      this.options.geLocale = function () { return null }
    }

    if(typeof this.options.getVueInstance !== "function"){
      this.options.getVueInstance = function () { 
        console.log('The vue instance getting function was not defined') 
        return null
      }
    }

    if (typeof this.options.appendLocaleToHeader === 'undefined') {
      this.options.appendLocaleToHeader = false
    }

    if (typeof this.options.appendLocaleToGetUrl === 'undefined') {
      this.options.appendLocaleToGetUrl = false
    } else if (this.options.appendLocaleToGetUrl === true) {
      this.options.urlLocalKey = this.options.urlLocalKey || 'l'
    }
  }

  /**
   * Modifies the request before it is sent
   *
   * @param {} config
   */
  requestInterceptors = (config) => {
    let vueInstance = this.options.getVueInstance()
    if (vueInstance) {
      // if yes, show the loading and add the authorization header
      if (vueInstance.eventBus) {
        vueInstance.eventBus.$emit(this.options.showLoadingEventName, true)
      }

      // Set/increase the pending request counter
      vueInstance.$pendingRequest = vueInstance.$pendingRequest ? vueInstance.$pendingRequest + 1 : 1
    }

    // Before each request, we check if the user is authenticated
    // This store isAuthenticated getter relies on the @/common/auth/auth.store.js module
    if (this.options.isAuthenticated()) {
      config.headers.common['Authorization'] = 'Bearer ' + this.options.getBearerToken()
    }

    let currentLocale = this.options.geLocale()

    if (this.options.appendLocaleToHeader && currentLocale) {
      config.headers.common['locale'] = this.options.geLocale()
    }
    if (this.options.appendLocaleToGetUrl) {
      let lUrlKey = this.options.urlLocalKey
      let urlQueryString = `=${lUrlKey}`

      // Check if the locael query string should be added
      if (config.method === 'get' && config.url.indexOf(urlQueryString) === -1 && currentLocale) {
        if (config.url.indexOf('?') > -1) {
          config.url += `&${lUrlKey}=${currentLocale}`
        } else {
          config.url += `?${lUrlKey}=${currentLocale}`
        }
      }
    }
    return config // you have to return the config, otherwise the request wil be blocked
  }

  /**
   * Modifies the response after it is returned
   * @param {*} response
   */
  responseInterceptors = (response) => {
    let vueInstance = this.options.getVueInstance()
    if (vueInstance) {
      // Decrease the pending request counter
      vueInstance.$pendingRequest--

      // If the the pending request counter is zero, so
      // we can hide the progress bar
      if (vueInstance.$pendingRequest === 0 && vueInstance.eventBus) {
        vueInstance.eventBus.$emit(this.options.showLoadingEventName, false)
      }
    }
    response = response.response || response
    response.data = response.data || {}
    return response
  }

  /**
   * Modifies the error/fail response after it is finished
   * @param {*} response
   */
  responseErrorInterceptors = (response) => {
    let vueInstance = this.options.getVueInstance()
    return new Promise((resolve, reject) => {
      if (vueInstance) {
        // Decrease the pending request counter
        vueInstance.$pendingRequest--

        // If the the pending request counter is zero, so
        // we can hide the progress bar
        if (vueInstance.$pendingRequest === 0 && vueInstance.eventBus) {
          vueInstance.eventBus.$emit(this.options.showLoadingEventName, false)
        }
      }
      response = response.response || response
      response.data = response.data || {}
      reject(response)
    })
  }
}
export default CrudHttp
