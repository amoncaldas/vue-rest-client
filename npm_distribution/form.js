'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CrudForm = function () {
  function CrudForm(formRef, context, options) {
    _classCallCheck(this, CrudForm);

    this.formRef = formRef;
    this.vm = context;
    this.options = options || {};
  }

  /**
   * Validate a form by running the default form validate and addition check for required field
   * If any field is invalid, sets the field as invalid, set it error message and shows a toaster with the error
   */


  _createClass(CrudForm, [{
    key: 'validate',
    value: function validate() {
      if (this.options.skipFormValidation) {
        return true;
      }
      var validForm = this.formRef.validate();

      // Validate the native `required` input attribute
      // that is not validated by the form.validate()
      if (!this.validateRequiredFields()) {
        validForm = false;
      }

      if (!validForm && !this.options.skipShowValidationMsg) {
        var errorMsg = this.options.invalidFormMsg || this.vm.$t('crud.invalidForm');
        // as we are not sure about the error message size, use multi-line model for the toaster
        this.vm.showError(this.capitalize(errorMsg), { mode: 'multi-line' });
      }
      return validForm;
    }

    /**
     * Validate the required input attribute
     *
     * @param {Object} form
     * @returns {Boolean}
     * @memberof CrudForm
     */

  }, {
    key: 'validateRequiredFields',
    value: function validateRequiredFields() {
      var _this = this;

      var validForm = true;
      this.getInputs(this.formRef).forEach(function (input) {
        // We only validate the  required attribute if the input is not yet invalid
        if (input.valid && input.required && (input.inputValue === undefined || input.inputValue === null || input.inputValue === '')) {
          input.valid = validForm = false;
          var errorMsg = input.label + ' ' + _this.vm.$t('crud.required') || _this.vm.$t('crud.inputRequired');
          input.errorBucket.push(errorMsg);
        }
      });
      return validForm;
    }

    /**
     * Retrieve all the form inputs
     *
     * @param {*} form
     * @returns Array
     * @memberof CrudForm
     */

  }, {
    key: 'getInputs',
    value: function getInputs(form) {
      var results = [];
      var search = function search(children) {
        var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        for (var index = 0; index < children.length; index++) {
          var child = children[index];
          if (child.errorBucket !== undefined) {
            results.push(child);
          } else {
            search(child.$children, depth + 1);
          }
        }
        if (depth === 0) return results;
      };

      return search(form.$children);
    }

    /**
     * Capitalize a string
     *
     * @param {*} string
     * @returns String
     */

  }, {
    key: 'capitalize',
    value: function capitalize(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  }]);

  return CrudForm;
}();

exports.default = CrudForm;