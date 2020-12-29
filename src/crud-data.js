/**
 * CRUD data object that must be used to be injected as a collection of
 * data attribute in the vue data section
 */
const CRUDData = {
  resource: null,
  resources: [],
  crudReady: false,
  modelService: null
}
// Export the CRUD and the CRUDData objects
export default CRUDData
