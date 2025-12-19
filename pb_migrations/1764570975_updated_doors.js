/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1423763397")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select2092856725",
    "maxSelect": 1,
    "name": "material",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Массив",
      "МДФ",
      "Шпон",
      "Экошпон",
      "ПВХ"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1423763397")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select2092856725",
    "maxSelect": 5,
    "name": "material",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Массив",
      "МДФ",
      "Шпон",
      "Экошпон",
      "ПВХ"
    ]
  }))

  return app.save(collection)
})
