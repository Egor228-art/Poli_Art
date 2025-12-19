/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1423763397")

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "number815914512",
    "max": null,
    "min": null,
    "name": "number_id",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1423763397")

  // remove field
  collection.fields.removeById("number815914512")

  return app.save(collection)
})
