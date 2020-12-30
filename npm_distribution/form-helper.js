"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _crudI18n = _interopRequireDefault(require("./i18n/crud.i18n.en"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var CrudForm = /*#__PURE__*/function () {
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
    key: "validate",
    value: function validate() {
      if (this.options.skipFormValidation) {
        return true;
      }

      if (this.formRef.validate && typeof this.formRef.validate === "function") {
        var _validForm = this.formRef.validate();
      } // Validate the native `required` input attribute
      // that is not validated by the form.validate()


      if (!this.validateRequiredFields()) {
        validForm = false;
      }

      if (!validForm && !this.options.skipShowValidationMsg) {
        var errorMsg = this.tanslateText('invalidFormMsg'); // as we are not sure about the error message size, use multi-line model for the toaster

        this.vm.showError(this.capitalize(errorMsg), {
          mode: 'multi-line'
        });
      }

      return validForm;
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
        console.error("The translation for the string ".concat(key, " was not passed via options, nor is present in 'crud.").concat(key, "' to be used via $t 'vue-i18n', so a fallback English string was used."));
        transaltion = _crudI18n["default"].crud[key] || key;
      }

      return transaltion;
    }
    /**
     * Validate the required input attribute
     *
     * @param {Object} form
     * @returns {Boolean}
     * @memberof CrudForm
     */

  }, {
    key: "validateRequiredFields",
    value: function validateRequiredFields() {
      var _this = this;

      var validForm = true;
      this.getInputs(this.formRef).forEach(function (input) {
        // We only validate the  required attribute if the input is not yet invalid
        if (input.valid && input.required && (input.inputValue === undefined || input.inputValue === null || input.inputValue === '')) {
          input.valid = validForm = false;

          var errorMsg = "".concat(input.label, " ").concat(_this.tanslateText('requiredMsg')) || _this.tanslateText('inputRequiredMsg');

          if (input.errorBucket && Array.isArray(input.errorBucket)) {
            input.errorBucket.push(errorMsg);
          }
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
    key: "getInputs",
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
    key: "capitalize",
    value: function capitalize(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  }]);

  return CrudForm;
}();

var _default = CrudForm;
exports["default"] = _default;