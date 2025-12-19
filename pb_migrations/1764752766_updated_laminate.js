/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3326637494")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select2092856725",
    "maxSelect": 9,
    "name": "type_room",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Ванная",
      "Гостинная",
      "Детская",
      "Кухня",
      "Магазин",
      "Офис",
      "Прихожая",
      "Спальня",
      "Общественная"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3326637494")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select2092856725",
    "maxSelect": 1,
    "name": "type_room",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Ванная",
      "Гостинная",
      "Детская",
      "Кухня",
      "Магазин",
      "Офис",
      "Прихожая",
      "Спальня",
      "Общественная"
    ]
  }))

  return app.save(collection)
})
