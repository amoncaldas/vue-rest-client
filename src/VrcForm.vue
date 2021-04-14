<template>
  <v-form class="vrc-form" ref="form" @keyup.native.enter="submit">
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
  </v-form>  
</template>
<script src="./vrc-form.js"></script>