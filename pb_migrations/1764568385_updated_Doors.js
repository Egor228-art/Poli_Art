/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1423763397")

  // update collection data
  unmarshal({
    "name": "doors"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1423763397")

  // update collection data
  unmarshal({
    "name": "Doors"
  }, collection)

  return app.save(collection)
})
