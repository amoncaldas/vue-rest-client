import ModelService from './model-service'
import CrudController from './crud-controller'
import VueRecaptcha from 'vue-recaptcha'

export default {
  name: 'vrc-form',
  template: `
    <v-form class="vrc-form" ref="vrcForm" @keyup.native.enter="submit">
      <slot name="default">
      </slot>
      <slot name="action" class="vrc-form-action-container" v-if="vm.crudReady">
        <v-btn color="secondary" style="float:right;margin-right:15px;margin-top:20px" left @click.native="submit">{{sendTitle}}</v-btn>
      </slot>
      <vue-recaptcha v-if="recaptchaKey" :sitekey="recaptchaKey"
        ref="recaptcha"
        size="invisible"
        @verify="onCaptchaVerified"
        @expired="onCaptchaExpired">
      </vue-recaptcha>
    </v-form>`,
  props: {
    contentId: {
      default: null
    },
    endpoint: {
      type: String,
      required: true
    },
    contentName: {
      type: String,
      required: true
    },
    mode: {
      type: String,
      default: 'create' // possible values: 'edit', 'create'
    },
    options: {
      type: Object,
      default: function () {
        return {}
      },
    },
    recaptchaKey: {
      type: String,
      required: false
    },
    sendTitle: {
      type: String,
      default: 'Send'
    },
    vm: {
      type: Object,
      default: function () {
        return {}
      },
    }
  },
  data () {
    return {
      verifiedCaptcha: false,
      context: null,
      crudOptions: null,
      httpOptions: null
    }
  },
  created () {
    if (this.options.http) {
      this.httpOptions = this.options.http
      delete this.options.http
    } else {
      this.httpOptions = {}
    }
    this.crudOptions = this.options
  },
  methods: {
    /**
     * Load the form and the resource, if necessary
     */
    load () {
      let formService = this.buildFormService()
      CrudController.set(this.vm, formService, this.crudOptions)

      if (this.contentId) {
        this.mode = 'edit' // if content id is passed, the form assume the edit only mode
        let context = this
        // get the data related to the userId defined
        formService.get(this.contentId).then((resource) => {
          context.vm.resource = resource          
          context.vm.crudReady = true
          context.$emit('resourceLoaded')
          context.$emit('loaded')
        }).catch(error => {
          context.$emit('reourceLoadingFailed')
          console.log(error)
        })
      } else {
        // Set the crud as ready
        this.vm.crudReady = true
        this.$emit('loaded')
      }
    },
    /**
     * Builds and return the form service object
     */
    buildFormService () {
      let raw = false
      if (this.httpOptions.raw === true) {
        raw = true
        delete this.httpOptions.raw
      }
      let pkName = false
      if (this.httpOptions.pk) {
        pkName = this.httpOptions.pk
        delete this.httpOptions.pk
      }
      let serviceOptions = {pk: pkName, raw: raw, httpClientOptions: this.httpOptions}
      if (httpOptions.transformRequest) {
        serviceOptions.transformRequest = httpOptions.transformRequest
        delete httpOptions.transformRequest
      }
      if (httpOptions.transformResponse) {
        serviceOptions.transformResponse = httpOptions.transformResponse
        delete httpOptions.transformResponse
      }
      const formService = new ModelService(this.endpoint, this.name, serviceOptions)
      return formService
    },
    runSave () {
      this.vm.save().then((resource) => {
        this.$emit('saved', resource)
      }).catch(err => {
        this.$emit('saveError', err)
      })
    },
    submit () {
      this.$emit('processing')
      if (this.recaptchaKey) {
        this.$refs.recaptcha.execute()
      } else {
        this.runSave()
      }
    },
    onCaptchaVerified (recaptchaToken) {
      this.vm.resource.recaptchaToken = recaptchaToken
      const self = this
      self.$refs.recaptcha.reset()
      self.verifiedCaptcha = true
      this.$emit('captchaVerified')
      this.runSave()
    },
    onCaptchaExpired () {
      this.$refs.recaptcha.reset()
      this.verifiedCaptcha = false
      this.$emit('captchaExpired')
    },
    loadRecaptcha () {
      return new Promise((resolve) => {
        let recaptchaScript = document.createElement('script')
        recaptchaScript.setAttribute('src', 'https://www.google.com/recaptcha/api.js?onload=vueRecaptchaApiLoaded&render=explicit')
        document.head.appendChild(recaptchaScript)

        // We tried to use onreadystatechange, but it doe snot fire
        // Try to find a better solution insted of timeout to detect
        // when the script has been loaded
        setTimeout(() => {
          resolve()
        }, 2000)
      })
    }
  },
  mounted () {
    this.load()
    if (this.recaptchaKey) {
      this.vm.crudReady = false
      this.loadRecaptcha().then(() => {
        this.vm.crudReady = true
      })
    }
  },
  components: {
    VueRecaptcha
  }
}
