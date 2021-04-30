"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _modelService = _interopRequireDefault(require("./model-service"));

var _crudController = _interopRequireDefault(require("./crud-controller"));

var _vueRecaptcha = _interopRequireDefault(require("vue-recaptcha"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default2 = {
  name: 'vrc-form',
  template: "\n    <v-form class=\"vrc-form\" ref=\"vrcForm\" @keyup.native.enter=\"submit\">\n      <slot name=\"default\">\n      </slot>\n      <slot name=\"action\" class=\"vrc-form-action-container\" v-if=\"vm.crudReady\">\n        <v-btn color=\"secondary\" style=\"float:right;margin-right:15px;margin-top:20px\" left @click.native=\"submit\">{{sendTitle}}</v-btn>\n      </slot>\n      <vue-recaptcha v-if=\"recaptchaKey\" :sitekey=\"recaptchaKey\"\n        ref=\"recaptcha\"\n        size=\"invisible\"\n        @verify=\"onCaptchaVerified\"\n        @expired=\"onCaptchaExpired\">\n      </vue-recaptcha>\n    </v-form>",
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
      "default": 'create' // possible values: 'edit', 'create'

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
    vm: {
      type: Object,
      "default": function _default() {
        return {};
      }
    }
  },
  data: function data() {
    return {
      verifiedCaptcha: false,
      context: null,
      crudOptions: null,
      httpOptions: null
    };
  },
  created: function created() {
    if (this.options.http) {
      this.httpOptions = this.options.http;
      delete this.options.http;
    } else {
      this.httpOptions = {};
    }

    this.crudOptions = this.options;
  },
  methods: {
    /**
     * Load the form and the resource, if necessary
     */
    load: function load() {
      var formService = this.buildFormService();

      _crudController["default"].set(this.vm, formService, this.crudOptions);

      if (this.contentId) {
        this.mode = 'edit'; // if content id is passed, the form assume the edit only mode

        var context = this; // get the data related to the userId defined

        formService.get(this.contentId).then(function (resource) {
          context.vm.resource = resource;
          context.vm.crudReady = true;
          context.$emit('resourceLoaded');
          context.$emit('loaded');
        })["catch"](function (error) {
          context.$emit('reourceLoadingFailed');
          console.log(error);
        });
      } else {
        // Set the crud as ready
        this.vm.crudReady = true;
        this.$emit('loaded');
      }
    },

    /**
     * Builds and return the form service object
     */
    buildFormService: function buildFormService() {
      var raw = false;

      if (this.httpOptions.raw === true) {
        raw = true;
        delete this.httpOptions.raw;
      }

      var pkName = 'id';

      if (this.httpOptions.pk) {
        pkName = this.httpOptions.pk;
        delete this.httpOptions.pk;
      }

      var serviceOptions = {
        pk: pkName,
        raw: raw,
        httpClientOptions: this.httpOptions
      };

      if (this.httpOptions.transformRequest) {
        serviceOptions.transformRequest = this.httpOptions.transformRequest;
        delete this.httpOptions.transformRequest;
      }

      if (this.httpOptions.transformResponse) {
        serviceOptions.transformResponse = this.httpOptions.transformResponse;
        delete this.httpOptions.transformResponse;
      }

      var formService = new _modelService["default"](this.endpoint, this.name, serviceOptions);
      return formService;
    },
    runSave: function runSave() {
      var _this = this;

      this.vm.save().then(function (resource) {
        _this.$emit('saved', resource);
      })["catch"](function (err) {
        _this.$emit('saveError', err);
      });
    },
    submit: function submit() {
      this.$emit('processing');

      if (this.recaptchaKey) {
        this.$refs.recaptcha.execute();
      } else {
        this.runSave();
      }
    },
    onCaptchaVerified: function onCaptchaVerified(recaptchaToken) {
      this.vm.resource.recaptchaToken = recaptchaToken;
      var self = this;
      self.$refs.recaptcha.reset();
      self.verifiedCaptcha = true;
      this.$emit('captchaVerified');
      this.runSave();
    },
    onCaptchaExpired: function onCaptchaExpired() {
      this.$refs.recaptcha.reset();
      this.verifiedCaptcha = false;
      this.$emit('captchaExpired');
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
      this.vm.crudReady = false;
      this.loadRecaptcha().then(function () {
        _this2.vm.crudReady = true;
      });
    }
  },
  components: {
    VueRecaptcha: _vueRecaptcha["default"]
  }
};
exports["default"] = _default2;