/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3326637494")

  // update collection data
  unmarshal({
    "listRule": "id != \"\"",
    "viewRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3326637494")

  // update collection data
  unmarshal({
    "listRule": null,
    "viewRule": "id != ''"
  }, collection)

  return app.save(collection)
})
