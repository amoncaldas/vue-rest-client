import ModelService from './model-service'
import CrudController from './crud-controller'
import VueRecaptcha from 'vue-recaptcha'

/**
 * Vue-Res-Client form (Vrc-Form)
 * @emits resourceLoaded (pass resource)
 * @emits reourceLoadingFailed (pass error)
 * @emits loaded
 * @emits saved (pass resource)
 * @emits saveError (pass error)
 * @emits submitting (when submit process starts)
 * @emits captchaVerified
 * @emits captchaExpired
 * @emits newEvent (passing {eventName: String, data: {*}})
 */

export default {
  name: 'vrc-form',
  template: `
    <v-form class="vrc-form" ref="form" @keyup.native.enter="submit">
      <slot name="default" v-bind:resource="resource">
      </slot>
      <slot name="action" class="vrc-form-action-container" v-if="crudReady">
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
      default: 'create' // possible values: edit, create
    },
    httpOptions: {
      type: Object,
      default: function () {
        return {}
      },
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
    res: {
      type: Object,
      default: function () {
        return {}
      },
    },
    list: {
      type: Array,
      default: function () {
        return []
      },
    }
  },
  created() {
    this.resource = this.res
    this.resources = this.list
  },
  data() {
    return {
      crudReady: false,
      verifiedCaptcha: false,
      context: null,
      resource: {},
      resources: []
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
          context.resources = resource          
          context.crudReady = true
          context.$emit('resourceLoaded', resource)
          context.$emit('newEvent', {eventName: 'resourceLoaded', data: resource})
          
          context.$emit('loaded')
          context.$emit('newEvent', {eventName: 'loaded'})
        }).catch(error => {
          context.$emit('reourceLoadingFailed', error)
          context.$emit('newEvent', {eventName: 'reourceLoadingFailed', data: error})
        })
      } else {
        // Set the crud as ready
        this.crudReady = true
        this.$emit('loaded')
        this.$emit('newEvent', {eventName: 'loaded'})
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
        this.$emit('newEvent', {eventName: 'saved', data: resource})
      }).catch(err => {
        this.$emit('saveError', err)
        this.$emit('newEvent', {eventName: 'saveError', data: err})
      })
    },
    submit () {
      this.$emit('submitting')
      this.$emit('newEvent', {eventName: 'submitting'})
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
      this.$emit('newEvent', {eventName: 'captchaVerified'})
      this.runSave()
    },
    onCaptchaExpired () {
      this.$refs.recaptcha.reset()
      this.verifiedCaptcha = false
      this.$emit('captchaExpired')
      this.$emit('newEvent', {eventName: 'captchaExpired'})
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
      this.crudReady = false
      this.loadRecaptcha().then(() => {
        this.crudReady = true
      })
    }
  },
  components: {
    VueRecaptcha
  }
}