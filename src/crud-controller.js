/**
 * The CRUD controller class allows to add the common extended CRUD actions (get, index, save, update, destroy)
 * to a component using the RESTFull API pattern. It is intended to be used in conjunction with the class ModelService (required by the constructor)
 *
 * This crud class implements the full cycle to get and send data to/from a remote server, including before destroy confirmation dialog,
 * refresh listed data after save, destroy and update and success and confirmation messages.
 *
 * @author <amoncaldas@gmail.com> Amon santana
 *
 * @param {*} vm the component content, that can be passed using ´this´
 * @param {*} modelService an instance of the ModelService class representing the service that provides the data service to a resource. @see @/core/model-service
 * @param {*} options object with optional parameters that allows to customize the CRUD behavior
 */

import FormHelper from './form-helper'
import crudI18nEN from './i18n/crud.i18n.en'
class Controller {
  constructor (vm, modelService, options) {
    this.vm = vm
    this.modelService = modelService

    // If options is not passed, initialize it
    this.options = options || {}

    this.run()
  }

  /**
   * Set the crud for he given view model, service and options
   * @param {*} vm
   * @param {*} modelService
   * @param {*} options
   */
  static set (vm, modelService, options) {
    return new Controller(vm, modelService, options)
  }

  /**
   * The initial function is executed when the class is built
   * if the option queryOnStartup is true, it will also load the resources automatically.
   */
  run () {
    this.vm.resource = this.modelService.newModelInstance()

    // Add the CRUD methods to the view model (vm) passed to the constructor
    this.vm.index = this.index
    this.vm.get = this.get
    this.vm.save = this.save
    this.vm.update = this.update
    this.vm.destroy = this.destroy
    this.vm.confirmAndDestroy = this.confirmAndDestroy
    this.vm.showSuccess = this.options.showSuccess || this.vm.showSuccess || this.showSuccess
    this.vm.showInfo = this.options.showInfo || this.vm.showInfo || this.showSuccess
    this.vm.showError = this.options.showError || this.vm.showError || this.showSuccess
    this.vm.confirmDialog = this.options.confirmDialog || this.vm.confirmDialog || this.confirmDialog

    // If quey on start up is enabled,
    // run the initial query
    if (this.options.queryOnStartup) {
      this.vm.index().then((resources) => {
        this.vm.resources = resources
        this.vm.crudReady = true
      })
    }
  }

  /**
   * TRansalte text to be displayed
   * @param {String} key
   * @return {String} msg
   */
  tanslateText (key) {
    let transaltion
    if (this.options[key]) {
      transaltion = this.options[key]
    }
    
    if (!transaltion && this.vm.$t) {
      let translationPath = `crud.${key}`
      let trans = this.vm.$t(translationPath)

      if (trans !== translationPath) {
        transaltion = trans
      }
    }
    if (!transaltion) {
      console.error(`The translation for the string ${key} was not passed via options, nor is present in 'crud.${key}' to be used via $t 'vue-i18n', so a fallback English string was used.`)
      transaltion = crudI18nEN.crud[key] || key
    }
    return transaltion
  }

  /**
   * Alternative function to show CRUD success
   * @param {String} msg
   * @param {*} options
   */
  showSuccess = (msg, options) => {
    console.log(msg, options)
  }
  /**
   * Alternative function to show CRUD info
   * @param {String} msg
   * @param {*} options
   */
  showInfo = (msg, options) => {
    console.info(msg, options)
  }
  /**
   * Alternative function to show CRUD error
   * @param {String} msg
   * @param {*} options
   */
  showError = (msg, options) => {
    console.error(msg, options)
  }

  /**
   * Alternative function to show CRUD error
   * @param {String} msg
   * @param {*} options
   */
  confirmDialog = (msg, options) => {
    let error = 'Confirm dialog function was not properly passed via parameters. Check the console to see more info.'
    console.error(error, msg, options)
    // As the confirm dialog function was not defined, the action has been cancelled
    return new Promise((resolve, reject) => {
      reject(error)
    })
  }

  /**
   * Action that queries the model service API, retrieve data and transform, by default,
   * Each resource of the result will be an active record like instance @see https://en.wikipedia.org/wiki/Active_record_pattern)
   * @param {*} filters
   * @returns {Promise}
   */
  index = (filters) => {
    let context = this
    return new Promise((resolve, reject) => {
      let proceed = context.runProceedCallBack('beforeIndex', reject)

      if (proceed) {
        // in the index action we do not use the resource model instance, but each
        // resource returned will be transformed into an active record instance bt the Model
        // you can skip this by defining the `raw` attribute equal true in the model service
        // @see @/core/model-service and @/core/model to read more
        context.modelService.query(filters).then((resources) => {
          if (resources.raw && resources.data) {
            resources = resources.data
          }
          // Each returned resource, will be, by default an Model (@core/model) instance, that supports instance methods, like $save, $destroy etc
          context.vm.resources = resources

          // runs the optional after callback (if the function is defined in the Vue component) an pass the data
          context.runAfterCallBack('afterIndex', this.vm.resources)

          // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!
          resolve(resources)
        },
        errorResponse => {
          // Handle the error response
          context.handleError(errorResponse, context.tanslateText('failWhileTryingToGetTheResourceMsg'))

          // if it is being run because of a queryOnStartup flag, so we need to tell
          // the client that the crud request is done
          if (context.options.queryOnStartup) {
            context.vm.crudReady = true
          }
        })
      }
    })
  }

  /**
   * Get a single resource data and transform in a Model instance
   * @see @/core/model-service and @/core/model to read more
   *
   * @param {*} pkValue
   * @returns {Promise}
   */
  get = (pkValue) => {
    let context = this
    return new Promise((resolve, reject) => {
      let proceed = context.runProceedCallBack('beforeGet', reject)

      if (proceed) {
        context.modelService.get(pkValue).then((resource) => {
          // The returned resource, will be, by default an Model (@core/model) instance, that supports instance methods, like $save, $destroy etc
          context.vm.resource = resource

          // runs the optional after callback (if the function is defined in the Vue component) an pass the data
          context.runAfterCallBack('afterGet', context.vm.resource)

          // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // context is not a problem!
          resolve(context.vm.resource)
        },
        errorResponse => {
          // Handle the error response
          context.handleError(errorResponse, context.tanslateText('failWhileTryingToGetTheResourceMsg'))

          // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!
          reject(errorResponse)
        })
      }
    })
  }

  /**
   * Save the current Model instance defined in this.vm.resource.
   * As the user should see only one form (that represents a resource) per time
   * there is no need to accept a resource (Model) as parameter
   *
   * @returns {Promise}
   */
  save = () => {
    let context = this

    // We return a promise and resolve/reject it because optionally, the developer
    // can have its own save method, and after it is finished do something special
    return new Promise((resolve, reject) => {
      let validForm = context.formIsValid(reject)
      let proceed = context.runProceedCallBack('beforeSave', reject)

      if (validForm && proceed) {
        let postResource = context.vm.resource.$strip(context.vm.resource)
        if (Object.keys(postResource).length === 0) {
          let msg = context.tanslateText('resourceEmptyMsg').replace(':resource', context.vm.resource.$getName())
          context.vm.showError(context.capitalize(msg), {mode: 'multi-line'})
          reject(msg)
        } else {
          context.vm.resource.$save().then((data) => {
            // the return is an object containing a resource/Model instance and a (optional) message property
            context.vm.resource = data.resource

            // Define the save confirmation message to be displayed
            let msg = data.message || context.tanslateText('resourceSavedMsg').replace(':resource', context.vm.resource.$getName())

            // Capitalize and use multiline to be sure that the message won be truncated (we don't know the how big the messages from server can be)
            context.vm.showSuccess(context.capitalize(msg), {mode: 'multi-line'})

            // Reload the data listed
            if (!context.options.skipAutoIndexAfterSave && !context.options.skipAutoIndexAfterAllEvents) {
              context.vm.index()
            }

            // runs the optional after callback (if the function is defined in the Vue component) an pass the data
            context.runAfterCallBack('afterSave', context.vm.resource)

            // In the default CRUD usage, it is not necessary to
            // listen to the promise result
            // if the promise is not being listened
            // it can raise an error when rejected/resolved.
            // This is not a problem!
            resolve(context.vm.resource)
          },
          errorResponse => {
            // Handle the error response
            context.handleError(errorResponse, context.tanslateText('failWhileTryingToSaveResourceMsg'))

            // In the default CRUD usage, it is not necessary to
            // listen to the promise result
            // if the promise is not being listened
            // it can raise an error when rejected/resolved.
            // This is not a problem!
            reject(errorResponse)
          })
        }
      }
    })
  }

  /**
   * Update the current Model instance defined in this.vm.resource.
   * As the user should see only one form (that represents a resource) per time
   * there is no need to accept a resource (Model) as parameter
   *
   * @returns {Promise}
   */
  update = () => {
    let context = this
    return new Promise((resolve, reject) => {
      let validForm = context.formIsValid(reject)
      let proceed = context.runProceedCallBack('beforeUpdate', reject)

      if (validForm && proceed) {
        context.vm.resource.$update().then((data) => {
          // the return is an object containing a resource/Model instance and a (optional) message property
          context.vm.resource = data.resource

          // Define the save confirmation message to be displayed
          let msg = data.message || context.tanslateText('resourceUpdatedMsg').replace(':resource', context.vm.resource.$getName())

          // Capitalize and use multiline to be sure that the message won be truncated (we don't know the how big the messages from server can be)
          context.vm.showSuccess(context.capitalize(msg), {mode: 'multi-line'})

          // Reload the data listed
          if (!context.options.skipAutoIndexAfterUpdate && !context.options.skipAutoIndexAfterAllEvents) {
            context.vm.index()
          }

          // runs the optional after callback (if the function is defined in the Vue component) an pass the data
          context.runAfterCallBack('afterUpdate', context.vm.resource)

          // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!
          resolve(context.vm.resource)
        },
        errorResponse => {
          // Handle the error response
          context.handleError(errorResponse, context.tanslateText('failWhileTryingToUpdateResourceMsg'))

          // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!
          reject(errorResponse)
        })
      }
    })
  }

  /**
   * Open a dialog to confirm the action and then run the destroy Destroy (delete) the current Model instance defined in this.vm.resource.
   * This method is intended to be used in a listing view, so it is necessary to pass the resource/Model
   *
   * @returns {Promise}
   */
  confirmAndDestroy = (resource) => {
    let context = this
    return new Promise((resolve, reject) => {
      // Define the conformation modal title to be displayed before destroying
      let confirmTitle = context.tanslateText('removalConfirmTitle')

      // Define the conformation modal text to be displayed before destroying
      let confirmMessage = context.tanslateText('doYouReallyWantToRemoveMsg').replace(':resource', context.vm.resource.$getName())

      // Open the confirmation modal and wait for the response in a promise
      context.vm.confirmDialog(confirmTitle, confirmMessage).then(() => {
        // if the user confirms the destroy, run it
        context.vm.destroy(resource).then(
          // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!
          resolve,
          reject
        )
      }, (error) => { // If the user has clicked `no` in the dialog, abort the destroy and show an aborted message
        // Define the error message to be displayed
        let msg = context.tanslateText('destroyAbortedMsg')

        // show the abort message as an info
        context.vm.showInfo(msg)

        // In the default CRUD usage, it is not necessary to
        // listen to the promise result
        // if the promise is not being listened
        // it can raise an error when rejected/resolved.
        // This is not a problem!
        reject(error)
      })
    })
  }

  /**
   * Run the destroy directly, without confirmation
   *
   * @param {*} resource to be destroyed
   * @returns {Promise}
   */
  destroy = (resource) => {
    let context = this
    return new Promise((resolve, reject) => {
      let proceed = context.runProceedCallBack('beforeDestroy', reject)

      if (proceed) {
        resource.$destroy().then((data) => {
          // Define the save confirmation message to be displayed
          let msg = data.message || context.tanslateText('resourceDestroyed').replace(':resource', context.vm.resource.$getName())

          // Capitalize and use multiline to be sure that the message won be truncated (we don't know the how big the messages from server can be)
          context.vm.showSuccess(context.capitalize(msg), {mode: 'multi-line'})

          // Reload the data listed
          if (!context.options.skipAutoIndexAfterDestroy && !context.options.skipAutoIndexAfterAllEvents) {
            context.vm.index()
          }

          // runs the optional after callback (if the function is defined in the Vue component) an pass the data
          context.runAfterCallBack('afterDestroy', resource)

          // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!
          resolve()
        },
        errorResponse => {
          // Handle the error response
          context.handleError(errorResponse, context.tanslateText('failWhileTryingToDestroyResourceMsg'))

          // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!
          reject(errorResponse)
        })
      }
    })
  }

  /**
   * Handle the error response
   *
   * @param {*} response
   * @param {*} actionMsg
   * @param {*} defaultCrudMsg
   * @memberof CRUD
   */
  handleError (response, actionMsg, defaultCrudMsg) {
    // There is no response message in this case, so we define the message considering the options custom message, the options status msg or the default one
    let treatment = this.getErrorTreatment(response, actionMsg, defaultCrudMsg)
    if (treatment !== false) {
      if (typeof treatment !== 'function') {
        this.showErrorMessage(response, treatment)
      } else {
        treatment(response, actionMsg, defaultCrudMsg)
      }
    }
    this.runAfterCallBack('afterError', response)
  }

  /**
   * Build the error message
   *
   * @param {*} errorResponse
   * @param {*} crudErrorMessage
   * @param {*} eventMsg
   * @returns {String|false|function} (if false, means no error message should be displayed)
   * @memberof CRUD
   */
  getErrorTreatment (errorResponse, eventMsg, crudErrorMessage) {
    // We try to get the error message to the returned http status code
    // If available, use it
    if (errorResponse.status && this.options[errorResponse.status] !== undefined) {
      return this.options[errorResponse.status]
    }

    // Use the event error message
    if (eventMsg !== null && eventMsg !== undefined) {
      return eventMsg
    }

    // If none works, use the default crudErrorMessage
    return crudErrorMessage.replace(':resource', this.vm.resource.$getName())
  }

  /**
   * Run the before proceed optional callback function
   * id the function returns false, stop the flow
   *
   * @param {*} callbackFunc
   * @param {*} reject promise reject pointer
   * @returns boolean
   */
  runProceedCallBack (callbackFunc, reject, data) {
    let proceed = true
    if (this.vm.hasOwnProperty(callbackFunc)) {
      proceed = this.vm[callbackFunc](data)
    }

    if (proceed === false) {
      let error = `proceed stopped on ${callbackFunc} function`
      console.log(error)
      let errorMsg = this.tanslateText('operationAbortedMsg')
      this.vm.showInfo(this.capitalize(errorMsg), {mode: 'multi-line'})

      // In the default CRUD usage, it is not necessary to
      // listen to the promise result
      // if the promise is not being listened
      // it can raise an error when rejected/resolved.
      // This is not a problem!
      reject(error)
    }

    return proceed === true || proceed === null || proceed === undefined
  }

  /**
   * Run the after optional callback function
   * If the function returns false, stop the flow
   * @param {*} callbackFunc
   * @param {*} data data to be passed
   */
  runAfterCallBack (callbackFunc, data) {
    if (this.vm.hasOwnProperty(callbackFunc)) {
      this.vm[callbackFunc](data)
    }
  }

  /**
   * Checks whenever the default form $rf exists and if so, if it is valid
   * If invalid, reject the promise and show the invalid form error message
   *
   * @param {Function} reject
   * @returns boolean
   */
  formIsValid (reject) {
    let validForm = true // init as valid
    let formRef = this.options.formRef || 'form' // get the form ref (custom or default one)
    let form = this.vm.$refs[formRef] || null // get the form object using the formRef

    let formHelper = new FormHelper(form, this.vm, this.options)
    validForm = formHelper.validate()
    if (!validForm) {
      let errorMsg = this.tanslateText('invalidFormMsg')
      // In the default CRUD usage, it is not necessary to
      // listen to the promise result
      // if the promise is not being listened
      // it can raise an error when rejected/resolved.
      // This is not a problem!
      reject(errorMsg)
    }
    // Validate the form
    return validForm
  }

  /**
   * Capitalize a string
   *
   * @param {*} string
   * @returns String
   */
  capitalize (string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  /**
   * Show the response error message or the default error message passed
   * @param {*} errorResponse
   * @param {*} defaultErrorMessage
   */
  showErrorMessage (errorResponse, frontEndErrorMessage) {
    let showError = true

    // If the message is set as `false` so we shall not display any message
    if (frontEndErrorMessage === false) {
      showError = false
    }

    if (this.vm.hasOwnProperty('beforeShowError')) {
      errorResponse.showError = showError // add the current showError status to the object passed to the call back
      showError = this.vm['beforeShowError'](errorResponse)
    }

    if (showError === true) {
      // As we don't want to show a raw error to the user, if the status code is == 500 (internal server error)
      // or there is no error response we show a friendly error message
      if (errorResponse === undefined || errorResponse.status === 500 || (!errorResponse.data || !errorResponse.data.message)) {
        // if it this and 500 case, we show only a friendly message, and log the error and log the error
        // as we are not sure about the error message size, use multi-line model for the toaster
        this.vm.showError(this.capitalize(frontEndErrorMessage), {mode: 'multi-line'})
        console.log(errorResponse)
      } else {
        // Define the error message to be used
        // either the front end message or the server one (if available)
        let errorMsg = frontEndErrorMessage
        if (!this.options.skipServerMessages) {
          errorMsg = errorResponse.message || errorResponse.data.message
        }

        // We show the response error message
        // As we are not sure about the error message size, use multi-line model for the toaster
        this.vm.showError(this.capitalize(errorMsg), {mode: 'multi-line'})
      }
    }
  }
}

// Export the Controller
export default Controller
