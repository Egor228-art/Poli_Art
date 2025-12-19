/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1423763397")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select1716930793",
    "maxSelect": 6,
    "name": "color",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Коричневый",
      "Бежевый",
      "Тёмно-зелёный",
      "Белый",
      "Чёрный",
      "Серый"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1423763397")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select1716930793",
    "maxSelect": 5,
    "name": "color",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Коричневый",
      "Бежевый",
      "Тёмно-зелёный",
      "Белый",
      "Чёрный",
      "Серый"
    ]
  }))

  return app.save(collection)
})
