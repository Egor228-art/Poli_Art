/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1423763397")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "select2363381545",
    "maxSelect": 1,
    "name": "type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Межкомнатная",
      "Входная"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1423763397")

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "select2363381545",
    "maxSelect": 2,
    "name": "type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Межкомнатная",
      "Входная"
    ]
  }))

  return app.save(collection)
})
