"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _modelService = _interopRequireDefault(require("./model-service"));

var _crudController = _interopRequireDefault(require("./crud-controller"));

var _vueRecaptcha = _interopRequireDefault(require("vue-recaptcha"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

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
var _default2 = {
  name: 'vrc-form',
  template: "\n    <v-form class=\"vrc-form\" ref=\"form\" @keyup.native.enter=\"submit\">\n      <slot name=\"default\" v-bind:resource=\"resource\">\n      </slot>\n      <slot name=\"action\" class=\"vrc-form-action-container\" v-if=\"crudReady\">\n        <v-btn color=\"secondary\" style=\"float:right;margin-right:15px;margin-top:20px\" left @click.native=\"submit\">{{sendTitle}}</v-btn>\n      </slot>\n      <vue-recaptcha v-if=\"recaptchaKey\" :sitekey=\"recaptchaKey\"\n        ref=\"recaptcha\"\n        size=\"invisible\"\n        @verify=\"onCaptchaVerified\"\n        @expired=\"onCaptchaExpired\">\n      </vue-recaptcha>\n    </v-form>",
  props: {
    contentId: {
      "default": null
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
      "default": 'create' // possible values: edit, create

    },
    httpOptions: {
      type: Object,
      "default": function _default() {
        return {};
      }
    },
    options: {
      type: Object,
      "default": function _default() {
        return {};
      }
    },
    recaptchaKey: {
      type: String,
      required: false
    },
    sendTitle: {
      type: String,
      "default": 'Send'
    },
    res: {
      type: Object,
      "default": function _default() {
        return {};
      }
    },
    list: {
      type: Array,
      "default": function _default() {
        return [];
      }
    }
  },
  created: function created() {
    this.resource = this.res;
    this.resources = this.list;
  },
  data: function data() {
    return {
      crudReady: false,
      verifiedCaptcha: false,
      context: null,
      resource: {},
      resources: []
    };
  },
  methods: {
    /**
     * Load the form and the resource, if necessary
     */
    load: function load() {
      var formService = this.buildFormService();

      _crudController["default"].set(this, formService, this.options);

      if (this.contentId) {
        this.mode = 'edit'; // if content id is passed, the form assume the edit only mode

        var context = this; // get the data related to the userId defined

        formService.get(this.contentId).then(function (resource) {
          context.resources = resource;
          context.crudReady = true;
          context.$emit('resourceLoaded', resource);
          context.$emit('newEvent', {
            eventName: 'resourceLoaded',
            data: resource
          });
          context.$emit('loaded');
          context.$emit('newEvent', {
            eventName: 'loaded'
          });
        })["catch"](function (error) {
          context.$emit('reourceLoadingFailed', error);
          context.$emit('newEvent', {
            eventName: 'reourceLoadingFailed',
            data: error
          });
        });
      } else {
        // Set the crud as ready
        this.crudReady = true;
        this.$emit('loaded');
        this.$emit('newEvent', {
          eventName: 'loaded'
        });
      }
    },

    /**
     * Builds and return the form service object
     */
    buildFormService: function buildFormService() {
      var serviceOptions = {
        raw: true,
        httpClientOptions: this.httpOptions
      };
      var formService = new _modelService["default"](this.endpoint, this.name, serviceOptions);
      return formService;
    },
    runSave: function runSave() {
      var _this = this;

      this.save().then(function (resource) {
        _this.$emit('saved', resource);

        _this.$emit('newEvent', {
          eventName: 'saved',
          data: resource
        });
      })["catch"](function (err) {
        _this.$emit('saveError', err);

        _this.$emit('newEvent', {
          eventName: 'saveError',
          data: err
        });
      });
    },
    submit: function submit() {
      this.$emit('submitting');
      this.$emit('newEvent', {
        eventName: 'submitting'
      });

      if (this.recaptchaKey) {
        this.$refs.recaptcha.execute();
      } else {
        this.runSave();
      }
    },
    onCaptchaVerified: function onCaptchaVerified(recaptchaToken) {
      this.resource.recaptchaToken = recaptchaToken;
      var self = this;
      self.$refs.recaptcha.reset();
      self.verifiedCaptcha = true;
      this.$emit('captchaVerified');
      this.$emit('newEvent', {
        eventName: 'captchaVerified'
      });
      this.runSave();
    },
    onCaptchaExpired: function onCaptchaExpired() {
      this.$refs.recaptcha.reset();
      this.verifiedCaptcha = false;
      this.$emit('captchaExpired');
      this.$emit('newEvent', {
        eventName: 'captchaExpired'
      });
    },
    loadRecaptcha: function loadRecaptcha() {
      return new Promise(function (resolve) {
        var recaptchaScript = document.createElement('script');
        recaptchaScript.setAttribute('src', 'https://www.google.com/recaptcha/api.js?onload=vueRecaptchaApiLoaded&render=explicit');
        document.head.appendChild(recaptchaScript); // We tried to use onreadystatechange, but it doe snot fire
        // Try to find a better solution insted of timeout to detect
        // when the script has been loaded

        setTimeout(function () {
          resolve();
        }, 2000);
      });
    }
  },
  mounted: function mounted() {
    var _this2 = this;

    this.load();

    if (this.recaptchaKey) {
      this.crudReady = false;
      this.loadRecaptcha().then(function () {
        _this2.crudReady = true;
      });
    }
  },
  components: {
    VueRecaptcha: _vueRecaptcha["default"]
  }
};
exports["default"] = _default2;