import crudI18nEN from './i18n/crud.i18n.en'
class CrudForm {
  constructor (formRef, context, options) {
    this.formRef = formRef
    this.vm = context
    this.options = options || {}
  }

  /**
   * Validate a form by running the default form validate and addition check for required field
   * If any field is invalid, sets the field as invalid, set it error message and shows a toaster with the error
   */
  validate () {
    if (this.options.skipFormValidation) {
      return true
    }
    let validForm = true
    if (this.formRef && typeof this.formRef.validate === "function") {
      validForm = this.formRef.validate()
    }

    // Validate the native `required` input attribute
    // that is not validated by the form.validate()
    if (!this.validateRequiredFields()) {
      validForm = false
    }

    if (!validForm && !this.options.skipShowValidationMsg) {
      let errorMsg = this.tanslateText('invalidFormMsg')
      // as we are not sure about the error message size, use multi-line model for the toaster
      this.vm.showError(this.capitalize(errorMsg), {mode: 'multi-line'})
    }
    return validForm
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
   * Validate the required input attribute
   *
   * @param {Object} form
   * @returns {Boolean}
   * @memberof CrudForm
   */
  validateRequiredFields () {
    let validForm = true
    let inputs = this.getInputs(this.formRef)
    inputs.forEach(input => {
      input.required = input.$el.hasAttribute('required') || input.$attrs.required !== undefined
      // We only validate the required attribute if the input is not yet invalid
      let validateType = typeof input.validate
      if (validateType === 'function') {
        input.valid = input.validate()
      }

      if (input.inputValue === undefined && input.value !== undefined) {
        input.inputValue = input.value
      }
      
      if (input.valid && input.required && (input.inputValue === undefined || input.inputValue === null || input.inputValue === '')) {
        input.valid = validForm = false
        let errorMsg = `${input.label} ${this.tanslateText('requiredMsg')}` || this.tanslateText('inputRequiredMsg')
        if (input.errorBucket && Array.isArray(input.errorBucket)) {
          input.errorBucket.push(errorMsg)
        }
      }

      let firstInvalid
      for (let key in inputs) {
        if (!inputs[key].valid) {
          firstInvalid = inputs[key]
          break
        }
      }
      if (firstInvalid && typeof firstInvalid.focus === 'function') {
        firstInvalid.focus()
      }
    })
    return validForm
  }

  /**
   * Retrieve all the form inputs
   *
   * @param {*} form
   * @returns Array
   * @memberof CrudForm
   */
  getInputs (form) {
    var results = []
    var search = function search (children) {
      var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0

      for (var index = 0; index < children.length; index++) {
        var child = children[index]
        if (child.$el.localName === 'input' || child.$_modelEvent === 'input') {
          results.push(child)
        } else {
          search(child.$children, depth + 1)
        }
      }
      if (depth === 0) return results
    }

    return search(form.$children)
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
}

export default CrudForm
