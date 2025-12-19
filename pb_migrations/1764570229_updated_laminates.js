/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3326637494")

  // update collection data
  unmarshal({
    "name": "laminate"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3326637494")

  // update collection data
  unmarshal({
    "name": "laminates"
  }, collection)

  return app.save(collection)
})
