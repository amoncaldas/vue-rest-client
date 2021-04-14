"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _modelService = _interopRequireDefault(require("./model-service"));

var _crudController = _interopRequireDefault(require("./crud-controller"));

var _crudData = _interopRequireDefault(require("./crud-data"));

var _vueRecaptcha = _interopRequireDefault(require("vue-recaptcha"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _default = {
  name: 'vrc-form',
  template: "<v-form class=\"vrc-form\" ref=\"form\" @keyup.native.enter=\"submit\">\n    <div slot=\"inputs\">\n    </div>\n    <div class=\"vrc-form-save-btn-container\" v-if=\"ready\">\n      <v-btn color=\"secondary\" left @click.native=\"submit\">{{saveTitle}}</v-btn>\n    </div>\n    <vue-recaptcha v-if=\"recaptcha_key\" :sitekey=\"recaptcha_key\"\n      ref=\"recaptcha\"\n      size=\"invisible\"\n      @verify=\"onCaptchaVerified\"\n      @expired=\"onCaptchaExpired\">\n    </vue-recaptcha>\n  </v-form>",
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
      "default": 'crud' // possible values: crud, edit, create

    },
    httpOptions: {
      type: Object,
      "default": {}
    },
    options: {
      type: Object,
      "default": {}
    },
    recaptchaKey: {
      type: String,
      required: false
    },
    saveTitle: {
      type: String,
      "default": 'Save'
    }
  },
  created: function created() {
    this.load();
  },
  data: function data() {
    return _objectSpread(_objectSpread({}, _crudData["default"]), {}, {
      // adds: resource, resources, crudReady and modelService
      verifiedCaptcha: false,
      context: null,
      ready: true
    });
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

        var _context = this; // get the data related to the userId defined


        formService.get(this.contentId).then(function (resource) {
          _context.resource = resource;
          _context.crudReady = true;

          _context.$emit('resourceLoaded');

          _context.$emit('loaded');
        })["catch"](function (error) {
          _context.$emit('reourceLoadingFailed');

          console.log(error);
        });
      } else {
        // Set the crud as ready
        this.crudReady = true;
        context.$emit('loaded');
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
      })["catch"](function (err) {
        _this.$emit('saveError', resource);
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
      this.resource.recaptchaToken = recaptchaToken;
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

    if (this.recaptchaKey) {
      this.ready = false;
      this.loadRecaptcha().then(function () {
        _this2.ready = true;
      });
    }
  },
  components: {
    VueRecaptcha: _vueRecaptcha["default"]
  }
};
exports["default"] = _default;