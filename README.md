# Vue rest client #

The VueRestClient integrates [Axios](https://github.com/axios/axios) and the concept of [Active Record](https://en.wikipedia.org/wiki/Active_record_pattern) to allows the communication with a back-end api with minimum code. It has an integrated http client with request and response interceptors that allows using authentication (via header Bearer) and localization via header and url parameter that can be automatically added if your options tell so. It can also optionally send request pending events (when still pending and when all are finished) so that you can catch these events and show a loading component.

There are four ways to use this component:

1. Use the `HttpClient` as an stand-alone client (supporting Bearer authentication, localization and loading events).
2. Define a `ModelService` that will be linked to a resource and perform CRUD operations.
3. Use the `CrudController` attached to a component, so that it will have the `save`, `get`, `index`, `update`, `destroy` and `confirmAndDestroy`. Additionally it also can automatically add form validation, callbacks that allow you to listen to events and intercept actions, and options that allow you to customize behaviors and message translations.
4. A combination of the three previously listed use cases.

## How to install ##

Install the library with npm:

``` npm install vue-rest-client --save ```

Or build the distribution file to use in HTML file or app:

```npm run browserBundleProduction```

This will be saved to `vue-rest-client/dist/vue-rest-client.js`.

## Component files ##

The solution is composed of the following files:

- [crud-controller.js](#src/crud-controller.js)
- [form-helper.js](#src/form-helper.js)
- [model-service.js](#src/model-service.js)
- [http-client.js](#src/http-client.js)
- [model.js](#src/model.js)
- [crud.i18n.en.js](#src/i18n/crud.i18n.en.js)

## Model Service ##

The `ModelService` class allows defining an instance that is linked to a given resource in the API. Once defined, it can be used to run REST actions (like query and get) for the defined endpoint/resource. Internally it uses the [Model](#/src/model.js) read more. By default the returned resources are converted into Active record models so that they have methods like `$save`, `$destroy` and `$update`.

Model Service constructor Parameters:

1. @param string - `endPoint` the relative url of the resource
1. @param string - `resourceName` the resource name (used to build the default confirmation messages)
1. @param {} options - `optional` options that allows to customize the model service behavior.

The options object may contain the following attributes:

- `transformRequest` (function, optional): executed before the request is made. Useful to change data in special circumstances.
    This function will receive an object with the endpoint and filters (when available) attributes. It is not intended to replace the Axios.
    request interceptor!
- `transformResponse` (function, optional): executed after the request is made, passing the original response object received.
    Useful if it necessary to modify the data returned before transforming them in a Model instance
- `raw` (boolean, optional): defines if the default transformation of the results into Model instances must be skipped.
    If it is true, the active record will not work with the returned items. Useful when you just want to get data, and not destroy/update them
- `pk` (string, optional): overwrites the default primary key attribute, that is 'id'. Use it if your model on the remote server uses a different field as primary key.
- `httpClientOptions` (object, optional): http client api options. It is expected an object with the structure described below:

```js
const httpClientOptions = {
  baseURL: '' // String, an empty string is the default
  isAuthenticated: () => {
    // run your logic to determine if a user is authenticated and return a boolean
  },
  getVueInstance: () => {
    // return the vuejs main instance
  },
  getBearerToken: () => {
    // run your logic and return the Bearer token
  },
  geLocale: () => {
    // run your logic and return the current app locale
  },
  appendLocaleToHeader: true/false,
  appendLocaleToGetUrl: true/false,
  urlLocaleKey: 'l' // String, 'l' is the default
}

export default httpClientOptions

```

How to create a model service to represent a resource in the back-end:

```js

// file my-model-service.js

import {ModelService} from 'vue-rest-client'

let options = {
  pk: 'my-pk-field-name' // necessary only if different of `id`

  // This is optional but if not 
  // passed some features will not work. Have a look in the 
  // http-client.js to check the details.
  httpClientOptions: httpClientOptions, // An object according example above (optional)
  raw: true/false // If you don't want the items to be converted to active record models. Default is false.
}
const myModelService = new ModelService('relative/url/to/resource/endpoint', 'My resource nice name', options)

export default myModelService
```

After this my-model-service.js file is created, you can import it anywhere in the app, and use the following methods:

- `getName` - returns the model nice name

- `getEndPoint` - returns the endpoint defined for the model service

- `query(filters)` - receives an array of query filters and returns a promise, that when resolved, passes a collection of resources

- `customQuery(customOptions, endPoint)` - receives an endpoint, an array of query filters and an object with custom options and returns a promise, that when resolved, passes a collection of resources. The customOptions allows the overwrite of the instance options only for the executed request. The `customOptions` and `endPoint` parameters are optional and will be replaced by the instance options endpoint if are null. The following options attributes can defined:
  - `query` (object): containing key -> value attributes to be used as query string)
  - `data` (object): containing key -> value attributes to be used as post data)
  - `verb` (string): verb to be used - default is 'get'
  - `transformRequest`: function to be called back on transformRequest event

- `get(pkValue)` - get a resource identified by its primary key value
- `newModelInstance (rawObject)` - convert a raw object into an active record Model.

Example of model service usage:

```js
import myModelService from './my-model-service'

export default {
  created () {
    // The properties defined in the filters object will be added to 
    // the query string using. For example page, page size or any other
    // parameter that your api supportes. It is optional.
    let filters = {}

    // Get the resources using the model service
    myModelService.query(filters).then((activeRecordModels) => {
      this.myModels = activeRecordModels
      // by default, each model is an instance of Model /src/model
      // having the $save, $update, $destroy, $copy methods
    })
  }
}
```

## Form validation ##

The `CrudController` utility uses the `form-helper.js` to validate the form before submitting the form. It looks for the `validate` function i the form object and traverse all the inputs and looks the properties `valid` `required` and `inputValue` and pushes an error message to the `errorBucket`, if it exists and is an array.

It is possible to disable the auto form validation by passing the `skipFormValidation:true` in the options object passed to the CrudController constructor. If the default behavior is on, the solution will look for a `v-form` reference, in your component context (passed as `vm`), named `form` *(like vm.$refs.form, where `vm` is the component context passed to the CrudController)*. It is also possible to specify a alternative form ref name, by setting the `formRef:<my-form-ref-name>(string)` in the options object passed to the constructor of CrudController.

It is also possible to use the form validation apart from the crud component. You just have to import it, create a new instance passing:

- the `formRef` object,
- the `vm` object (the component **this**)
- the optional `options` object.

 Then, just run the `validate` method. It will run the default form object passed in the formRef validation and also check for the `required` attribute in each input and validate it. If any field is invalid, it will highlight it, set the `valid` status as false and also add a string to the inputs the error bucket using input label and crud translations for `required`.

## Adding CRUD functionalities to a component ##

The CrudController class allows to add common extended CRUD actions (get, index, save, update, destroy)
to a component that uses the RESTFul API pattern. It is intended to be used in conjunction with the class ModelService (required by the constructor)

This crud class implements the full cycle to get and send data to/from a remote server, including before destroy confirmation dialog,
refresh listed data after save, destroy and update and success and confirmation messages.

To use this feature you will need to import `CrudController` and `CrudData` and use them as follows:

The `CrudController` **set** method expects the following parameters:

1. @param {} `vm` - the component instance, that can be passed using `this`
1. @param {} `modelService`  - an instance of the ModelService class representing the service that provides the data service to a resource. @see src/model-service
1. @param {} `options` - object with optional parameters that allows to customize the CRUD behavior

The options object may contain the following properties:

### Messages and texts ###

- `resourceSavedMsg` (string): custom message for resource saved
- `resourceEmptyMsg` (string) custom message for resource empty
- `resourceUpdatedMsg` (string) custom message for resource updated
- `operationAbortedMsg` (string): custom message for operation aborted.
- `failWhileTryingToGetTheResourceMsg` (string): custom message for fail while trying to get resource
- `saveFailedMsg` (string): custom message to be displayed on save action failure
- `updatedMsg` (string): custom message to be displayed on update action failure
- `confirmDestroyTitle` (string): custom title to be displayed on the confirm dialog shown before destroy action
- `doYouReallyWantToRemoveMsg` (string): custom text to be displayed on the confirm dialog shown before destroy action
- `destroyedMsg` (string): custom message to be displayed after an resource has been destroyed
- `failWhileTryingToDestroyResourceMsg` (string): custom message to be displayed on destroy action failure
- `failWhileTryingToUpdateResourceMsg` (string): custom message for update failure
- `destroyAbortedMsg` (string): custom message to be displayed when a destroy is aborted
- `resourceDestroyedMsg` (string): custom message for resource destroyed
- `invalidFormMsg` (string): custom invalid form message
- `removalConfirmTitle`: (string): custom message for removal conform title

### Other options ###

- `queryOnStartup` (boolean): if the index action must be ran on the first CRUD run
- `skipFormValidation` (boolean): skips the auto form validation
- `skipDestroyConfirmation` (boolean): skips the destroy confirmation dialog and runs the destroy directly
- `skipFormValidation` (boolean): skips the auto form validation
- `skipAutoIndexAfterAllEvents` (boolean) : skips the auto resources reload after data change events (update, destroy and save)
- `skipAutoIndexAfterSave` (boolean) : skips the auto resources reload after save
- `skipAutoIndexAfterUpdate` (boolean) : skips the auto resources reload after update
- `skipAutoIndexAfterDestroy` (boolean) : skips the auto resources reload after destroy
- `skipServerMessages` (boolean) : skip using server returned message and use only front end messages do display toasters
- `skipShowValidationMsg` (boolean) : skit showing the validation error message via toaster when a form is invalid
- `formRef` (string, optional) : the alternative name of the form ref you are using in the template. Used to auto validate the form. If not provided, it is assumed that the form ref name is `form`
- `showSuccess`: function to be called to show action success message
- `showInfo`: function to be called to show action info message
- `showError`: function to be called to show action error
- `confirmDialog`: function to be called when a confirm resource removal action is run. Expected to return a promise
- `[http-error-status-code-number]` : defines the message to be used when an http error status code is returned by a request (only available fot status code from `300` to `505`)

If your component/vue instance has the functions `showSuccess`, `showInfo`, `showError` and `confirmDialog`, they will be called if these functions are not passed via options and when the corresponding event occurs. the same way, if your component/vue instance has the `$t` function (created by `vue-i18n` component) it will be used to translate the CRUD messages by trying to get it, for example, via `crud.resourceSavedMsg`. If you are not using it, just pass the translations via options or `translationFn` via options.

Example of adding CRUD features to a Vue component:

```js
import VueRestClient from 'vue-rest-client'
import myModelService from 'path/to/my/defined/model-service'

// Then, inside your default export

export default {
  data: () => ({
    // create the crud data objects (resource, resources and modelService) using three dots notation
    ...VueRestClient.CrudData
  })

  // The second one must be used to instantiate the crud class on the vue created event, like this:
  created () {
    // Extend this component, adding CRUD functionalities
    let options = {...}
    // `this` below represents the `vm` object inside the CrudController
    VueRestClient.Controller.set(this, myModelService, options)
  }
}
```

A toast message is shown after each action using the following priority: server response message,
custom message specified in options or the default one (defined in `src/i18n/crud.i18n.en.js`). To show these toasters, the `CrudController` meeds to use the `showSuccess`, `showInfo`,  `showError` and `confirmDialog` methods. So it will look for them and use them, in the following order:

- In the options object
- Defined in your component (passed via `vm`)
- Use the fall back version defined in `CrudController` (that will redirect the message to the console)

The CrudController will fire events during its actions and optional listening functions can be defined for these events:

If the vue `component` passed via `vm` to which you are adding the CRUD actions has one of the following defined methods, it is gonna be called by the CrudController. If it returns false, the execution will be rejected and stopped.

- `beforeIndex` - index means listing resources of a given endpoint
- `beforeGet`
- `beforeSave`
- `beforeUpdate`
- `beforeDestroy`
- `beforeShowError`

If the vue `component` passed via `vm` to which you are adding the CRUD has one of the following defined methods, it is gonna be called by the CrudController passing the related data

- `afterIndex`
- `afterGet`
- `afterSave`
- `afterUpdate`
- `afterDestroy`
- `afterError`

Form validation:
If the vue `component` passed via `vm` to which you are adding the CRUD has a `$ref` named `form` and it does not have the option `skipFormValidation` defined as `true`, the auto form validation will be ran before saving and updating resources.
