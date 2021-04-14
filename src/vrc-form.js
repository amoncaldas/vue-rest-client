import ModelService from './model-service'
import CrudController from './crud-controller'
import CrudData from './crud-data'
import VueRecaptcha from 'vue-recaptcha'

export default {
  name: 'vrc-form',
  template: `<v-form class="vrc-form" ref="form" @keyup.native.enter="submit">
    <div slot="inputs">
    </div>
    <div class="vrc-form-save-btn-container" v-if="ready">
      <v-btn color="secondary" left @click.native="submit">{{saveTitle}}</v-btn>
    </div>
    <vue-recaptcha v-if="recaptcha_key" :sitekey="recaptcha_key"
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
      default: 'crud' // possible values: crud, edit, create
    },
    httpOptions: {
      type: Object,
      default: {}
    },
    options: {
      type: Object,
      default: {}
    },
    recaptchaKey: {
      type: String,
      required: false
    },
    saveTitle: {
      type: String,
      default: 'Save'
    }
  },
  created() {
    this.load()
  },
  data() {
    return {
      ...CrudData, // adds: resource, resources, crudReady and modelService
      verifiedCaptcha: false,
      context: null,
      ready: true
    }
  },
  methods: {
    /**
     * Load the form and the resource, if necessary
     */
    load () {
      let formService = this.buildFormService()
      CrudController.set(this, formService, this.options)

      if (this.contentId) {
        this.mode = 'edit' // if content id is passed, the form assume the edit only mode
        let context = this
        // get the data related to the userId defined
        formService.get(this.contentId).then((resource) => {
          context.resource = resource          
          context.crudReady = true
          context.$emit('resourceLoaded')
          context.$emit('loaded')
        }).catch(error => {
          context.$emit('reourceLoadingFailed')
          console.log(error)
        })
      } else {
        // Set the crud as ready
        this.crudReady = true
        context.$emit('loaded')
      }
    },
    /**
     * Builds and return the form service object
     */
    buildFormService () {
      let serviceOptions = {
        raw: true,
        httpClientOptions: this.httpOptions
      }
      const formService = new ModelService(this.endpoint, this.name, serviceOptions)
      return formService
    },
    runSave () {
      this.save().then((resource) => {
        this.$emit('saved', resource)
      }).catch(err => {
        this.$emit('saveError', resource)
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
      this.resource.recaptchaToken = recaptchaToken
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
    if (this.recaptchaKey) {
      this.ready = false
      this.loadRecaptcha().then(() => {
        this.ready = true
      })
    }
  },
  components: {
    VueRecaptcha
  }
}
