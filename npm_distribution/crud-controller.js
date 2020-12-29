"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _formHelper = _interopRequireDefault(require("./form-helper"));

var _crudI18n = _interopRequireDefault(require("./i18n/crud.i18n.en"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Controller = /*#__PURE__*/function () {
  function Controller(vm, modelService, options) {
    _classCallCheck(this, Controller);

    _initialiseProps.call(this);

    this.vm = vm;
    this.modelService = modelService; // If options is not passed, initialize it

    this.options = options || {};
    this.run();
  }
  /**
   * Set the crud for he given view model, service and options
   * @param {*} vm
   * @param {*} modelService
   * @param {*} options
   */


  _createClass(Controller, [{
    key: "run",

    /**
     * The initial function is executed when the class is built
     * if the option queryOnStartup is true, it will also load the resources automatically.
     */
    value: function run() {
      var _this = this;

      this.vm.resource = this.modelService.newModelInstance(); // Add the CRUD methods to the view model (vm) passed to the constructor

      this.vm.index = this.index;
      this.vm.get = this.get;
      this.vm.save = this.save;
      this.vm.update = this.update;
      this.vm.destroy = this.destroy;
      this.vm.confirmAndDestroy = this.confirmAndDestroy;
      this.vm.showSuccess = this.options.showSuccess || this.vm.showSuccess || this.showSuccess;
      this.vm.showInfo = this.options.showInfo || this.vm.showInfo || this.showSuccess;
      this.vm.showError = this.options.showError || this.vm.showError || this.showSuccess;
      this.vm.confirmDialog = this.options.confirmDialog || this.vm.confirmDialog || this.confirmDialog; // If quey on start up is enabled,
      // run the initial query

      if (this.options.queryOnStartup) {
        this.vm.index().then(function (resources) {
          _this.vm.resources = resources;
          _this.vm.crudReady = true;
        });
      }
    }
    /**
     * TRansalte text to be displayed
     * @param {String} key
     * @return {String} msg
     */

  }, {
    key: "tanslateText",
    value: function tanslateText(key) {
      var transaltion;

      if (this.options[key]) {
        transaltion = this.options[key];
      }

      if (!transaltion && this.vm.$t) {
        var translationPath = "crud.".concat(key);
        var trans = this.vm.$t(translationPath);

        if (trans !== translationPath) {
          transaltion = trans;
        }
      }

      if (!transaltion) {
        console.error("The translation for a string ".concat(key, " passed via options, nor is present in 'crud.").concat(key, "' to be used via vue-i18n, so a fallback english string was used."));
        transaltion = _crudI18n["default"].crud[key] || key;
      }

      return transaltion;
    }
    /**
     * Alternative function to show CRUD success
     * @param {String} msg
     * @param {*} options
     */

  }, {
    key: "handleError",

    /**
     * Handle the error response
     *
     * @param {*} response
     * @param {*} actionMsg
     * @param {*} defaultCrudMsg
     * @memberof CRUD
     */
    value: function handleError(response, actionMsg, defaultCrudMsg) {
      // There is no response message in this case, so we define the message considering the options custom message, the options status msg or the default one
      var treatment = this.getErrorTreatment(response, actionMsg, defaultCrudMsg);

      if (treatment !== false) {
        if (typeof treatment !== 'function') {
          this.showErrorMessage(response, treatment);
        } else {
          treatment(response, actionMsg, defaultCrudMsg);
        }
      }

      this.runAfterCallBack('afterError', response);
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

  }, {
    key: "getErrorTreatment",
    value: function getErrorTreatment(errorResponse, eventMsg, crudErrorMessage) {
      // We try to get the error message to the returned http status code
      // If available, use it
      if (errorResponse.status && this.options[errorResponse.status] !== undefined) {
        return this.options[errorResponse.status];
      } // Use the event error message


      if (eventMsg !== null && eventMsg !== undefined) {
        return eventMsg;
      } // If none works, use the default crudErrorMessage


      return crudErrorMessage.replace(':resource', this.vm.resource.$getName());
    }
    /**
     * Run the before proceed optional callback function
     * id the function returns false, stop the flow
     *
     * @param {*} callbackFunc
     * @param {*} reject promise reject pointer
     * @returns boolean
     */

  }, {
    key: "runProceedCallBack",
    value: function runProceedCallBack(callbackFunc, reject, data) {
      var proceed = true;

      if (this.vm.hasOwnProperty(callbackFunc)) {
        proceed = this.vm[callbackFunc](data);
      }

      if (proceed === false) {
        var error = "proceed stopped on ".concat(callbackFunc, " function");
        console.log(error);
        var errorMsg = this.tanslateText('operationAbortedMsg');
        this.vm.showInfo(this.capitalize(errorMsg), {
          mode: 'multi-line'
        }); // In the default CRUD usage, it is not necessary to
        // listen to the promise result
        // if the promise is not being listened
        // it can raise an error when rejected/resolved.
        // This is not a problem!

        reject(error);
      }

      return proceed === true || proceed === null || proceed === undefined;
    }
    /**
     * Run the after optional callback function
     * If the function returns false, stop the flow
     * @param {*} callbackFunc
     * @param {*} data data to be passed
     */

  }, {
    key: "runAfterCallBack",
    value: function runAfterCallBack(callbackFunc, data) {
      if (this.vm.hasOwnProperty(callbackFunc)) {
        this.vm[callbackFunc](data);
      }
    }
    /**
     * Checks whenever the default form $rf exists and if so, if it is valid
     * If invalid, reject the promise and show the invalid form error message
     *
     * @param {*} reject
     * @returns boolean
     */

  }, {
    key: "formIsValid",
    value: function formIsValid(reject) {
      var validForm = true; // init as valid

      var formRef = this.options.formRef || 'form'; // get the form ref (custom or default one)

      var form = this.vm.$refs[formRef] || null; // get the form object using the formRef

      var formHelper = new _formHelper["default"](form, this.vm, this.options);
      validForm = formHelper.validate();

      if (!validForm) {
        var errorMsg = this.tanslateText('invalidFormMsg'); // In the default CRUD usage, it is not necessary to
        // listen to the promise result
        // if the promise is not being listened
        // it can raise an error when rejected/resolved.
        // This is not a problem!

        reject(errorMsg);
      } // Validate the form


      return validForm;
    }
    /**
     * Capitalize a string
     *
     * @param {*} string
     * @returns String
     */

  }, {
    key: "capitalize",
    value: function capitalize(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    /**
     * Show the response error message or the default error message passed
     * @param {*} errorResponse
     * @param {*} defaultErrorMessage
     */

  }, {
    key: "showErrorMessage",
    value: function showErrorMessage(errorResponse, frontEndErrorMessage) {
      var showError = true; // If the message is set as `false` so we shall not display any message

      if (frontEndErrorMessage === false) {
        showError = false;
      }

      if (this.vm.hasOwnProperty('beforeShowError')) {
        errorResponse.showError = showError; // add the current showError status to the object passed to the call back

        showError = this.vm['beforeShowError'](errorResponse);
      }

      if (showError === true) {
        // As we don't want to show a raw error to the user, if the status code is == 500 (internal server error)
        // or there is no error response we show a friendly error message
        if (errorResponse === undefined || errorResponse.status === 500 || !errorResponse.data || !errorResponse.data.message) {
          // if it this and 500 case, we show only a friendly message, and log the error and log the error
          // as we are not sure about the error message size, use multi-line model for the toaster
          this.vm.showError(this.capitalize(frontEndErrorMessage), {
            mode: 'multi-line'
          });
          console.log(errorResponse);
        } else {
          // Define the error message to be used
          // either the front end message or the server one (if available)
          var errorMsg = frontEndErrorMessage;

          if (!this.options.skipServerMessages) {
            errorMsg = errorResponse.message || errorResponse.data.message;
          } // We show the response error message
          // As we are not sure about the error message size, use multi-line model for the toaster


          this.vm.showError(this.capitalize(errorMsg), {
            mode: 'multi-line'
          });
        }
      }
    }
  }], [{
    key: "set",
    value: function set(vm, modelService, options) {
      return new Controller(vm, modelService, options);
    }
  }]);

  return Controller;
}(); // Export the Controller


var _initialiseProps = function _initialiseProps() {
  var _this2 = this;

  this.showSuccess = function (msg, options) {
    console.log(msg, options);
  };

  this.showInfo = function (msg, options) {
    console.info(msg, options);
  };

  this.showError = function (msg, options) {
    console.error(msg, options);
  };

  this.confirmDialog = function (msg, options) {
    var error = 'Confirm dialog function was not properly passed via parameters. Check the console to see more info.';
    console.error(error, msg, options); // As the confirm dialog function was not defined, the action has been cancelled

    return new Promise(function (resolve, reject) {
      reject(error);
    });
  };

  this.index = function (filters) {
    var context = _this2;
    return new Promise(function (resolve, reject) {
      var proceed = context.runProceedCallBack('beforeIndex', reject);

      if (proceed) {
        // in the index action we do not use the resource model instance, but each
        // resource returned will be transformed into an active record instance bt the Model
        // you can skip this by defining the `raw` attribute equal true in the model service
        // @see @/core/model-service and @/core/model to read more
        context.modelService.query(filters).then(function (resources) {
          if (resources.raw && resources.data) {
            resources = resources.data;
          } // Each returned resource, will be, by default an Model (@core/model) instance, that supports instance methods, like $save, $destroy etc


          context.vm.resources = resources; // runs the optional after callback (if the function is defined in the Vue component) an pass the data

          context.runAfterCallBack('afterIndex', _this2.vm.resources); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!

          resolve(resources);
        }, function (errorResponse) {
          // Handle the error response
          context.handleError(errorResponse, context.tanslateText('failWhileTryingToGetTheResourceMsg')); // if it is being run because of a queryOnStartup flag, so we need to tell
          // the client that the crud request is done

          if (context.options.queryOnStartup) {
            context.vm.crudReady = true;
          }
        });
      }
    });
  };

  this.get = function (pkValue) {
    var context = _this2;
    return new Promise(function (resolve, reject) {
      var proceed = context.runProceedCallBack('beforeGet', reject);

      if (proceed) {
        context.modelService.get(pkValue).then(function (resource) {
          // The returned resource, will be, by default an Model (@core/model) instance, that supports instance methods, like $save, $destroy etc
          context.vm.resource = resource; // runs the optional after callback (if the function is defined in the Vue component) an pass the data

          context.runAfterCallBack('afterGet', context.vm.resource); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // context is not a problem!

          resolve(context.vm.resource);
        }, function (errorResponse) {
          // Handle the error response
          context.handleError(errorResponse, context.tanslateText('failWhileTryingToGetTheResourceMsg')); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!

          reject(errorResponse);
        });
      }
    });
  };

  this.save = function () {
    var context = _this2; // We return a promise and resolve/reject it because optionally, the developer
    // can have its own save method, and after it is finished do something special

    return new Promise(function (resolve, reject) {
      var validForm = context.formIsValid(reject);
      var proceed = context.runProceedCallBack('beforeSave', reject);

      if (validForm && proceed) {
        var postResource = context.vm.resource.$strip(context.vm.resource);

        if (Object.keys(postResource).length === 0) {
          var msg = context.tanslateText('resourceEmptyMsg').replace(':resource', context.vm.resource.$getName());
          context.vm.showError(context.capitalize(msg), {
            mode: 'multi-line'
          });
          reject(msg);
        } else {
          context.vm.resource.$save().then(function (data) {
            // the return is an object containing a resource/Model instance and a (optional) message property
            context.vm.resource = data.resource; // Define the save confirmation message to be displayed

            var msg = data.message || context.tanslateText('resourceSavedMsg').replace(':resource', context.vm.resource.$getName()); // Capitalize and use multiline to be sure that the message won be truncated (we don't know the how big the messages from server can be)

            context.vm.showSuccess(context.capitalize(msg), {
              mode: 'multi-line'
            }); // Reload the data listed

            if (!context.options.skipAutoIndexAfterSave && !context.options.skipAutoIndexAfterAllEvents) {
              context.vm.index();
            } // runs the optional after callback (if the function is defined in the Vue component) an pass the data


            context.runAfterCallBack('afterSave', context.vm.resource); // In the default CRUD usage, it is not necessary to
            // listen to the promise result
            // if the promise is not being listened
            // it can raise an error when rejected/resolved.
            // This is not a problem!

            resolve(context.vm.resource);
          }, function (errorResponse) {
            // Handle the error response
            context.handleError(errorResponse, context.tanslateText('failWhileTryingToSaveResourceMsg')); // In the default CRUD usage, it is not necessary to
            // listen to the promise result
            // if the promise is not being listened
            // it can raise an error when rejected/resolved.
            // This is not a problem!

            reject(errorResponse);
          });
        }
      }
    });
  };

  this.update = function () {
    var context = _this2;
    return new Promise(function (resolve, reject) {
      var validForm = context.formIsValid(reject);
      var proceed = context.runProceedCallBack('beforeUpdate', reject);

      if (validForm && proceed) {
        context.vm.resource.$update().then(function (data) {
          // the return is an object containing a resource/Model instance and a (optional) message property
          context.vm.resource = data.resource; // Define the save confirmation message to be displayed

          var msg = data.message || context.tanslateText('resourceUpdatedMsg').replace(':resource', context.vm.resource.$getName()); // Capitalize and use multiline to be sure that the message won be truncated (we don't know the how big the messages from server can be)

          context.vm.showSuccess(context.capitalize(msg), {
            mode: 'multi-line'
          }); // Reload the data listed

          if (!context.options.skipAutoIndexAfterUpdate && !context.options.skipAutoIndexAfterAllEvents) {
            context.vm.index();
          } // runs the optional after callback (if the function is defined in the Vue component) an pass the data


          context.runAfterCallBack('afterUpdate', context.vm.resource); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!

          resolve(context.vm.resource);
        }, function (errorResponse) {
          // Handle the error response
          context.handleError(errorResponse, context.tanslateText('failWhileTryingToUpdateResourceMsg')); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!

          reject(errorResponse);
        });
      }
    });
  };

  this.confirmAndDestroy = function (resource) {
    var context = _this2;
    return new Promise(function (resolve, reject) {
      // Define the conformation modal title to be displayed before destroying
      var confirmTitle = context.tanslateText('removalConfirmTitle'); // Define the conformation modal text to be displayed before destroying

      var confirmMessage = context.tanslateText('doYouReallyWantToRemoveMsg').replace(':resource', context.vm.resource.$getName()); // Open the confirmation modal and wait for the response in a promise

      context.vm.confirmDialog(confirmTitle, confirmMessage).then(function () {
        // if the user confirms the destroy, run it
        context.vm.destroy(resource).then( // In the default CRUD usage, it is not necessary to
        // listen to the promise result
        // if the promise is not being listened
        // it can raise an error when rejected/resolved.
        // This is not a problem!
        resolve, reject);
      }, function (error) {
        // If the user has clicked `no` in the dialog, abort the destroy and show an aborted message
        // Define the error message to be displayed
        var msg = context.tanslateText('destroyAbortedMsg'); // show the abort message as an info

        context.vm.showInfo(msg); // In the default CRUD usage, it is not necessary to
        // listen to the promise result
        // if the promise is not being listened
        // it can raise an error when rejected/resolved.
        // This is not a problem!

        reject(error);
      });
    });
  };

  this.destroy = function (resource) {
    var context = _this2;
    return new Promise(function (resolve, reject) {
      var proceed = context.runProceedCallBack('beforeDestroy', reject);

      if (proceed) {
        resource.$destroy().then(function (data) {
          // Define the save confirmation message to be displayed
          var msg = data.message || context.tanslateText('resourceDestroyed').replace(':resource', context.vm.resource.$getName()); // Capitalize and use multiline to be sure that the message won be truncated (we don't know the how big the messages from server can be)

          context.vm.showSuccess(context.capitalize(msg), {
            mode: 'multi-line'
          }); // Reload the data listed

          if (!context.options.skipAutoIndexAfterDestroy && !context.options.skipAutoIndexAfterAllEvents) {
            context.vm.index();
          } // runs the optional after callback (if the function is defined in the Vue component) an pass the data


          context.runAfterCallBack('afterDestroy', resource); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!

          resolve();
        }, function (errorResponse) {
          // Handle the error response
          context.handleError(errorResponse, context.tanslateText('failWhileTryingToDestroyResourceMsg')); // In the default CRUD usage, it is not necessary to
          // listen to the promise result
          // if the promise is not being listened
          // it can raise an error when rejected/resolved.
          // This is not a problem!

          reject(errorResponse);
        });
      }
    });
  };
};

var _default = Controller;
exports["default"] = _default;