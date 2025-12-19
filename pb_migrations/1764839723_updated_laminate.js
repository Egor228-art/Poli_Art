/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3326637494")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select1716930793",
    "maxSelect": 15,
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
      "Светлый",
      "Серый",
      "Золото-коричневый",
      "Кремовый",
      "Светло-бежевый",
      "Светло-Коричневый",
      "Светло-серый",
      "Серо-бежевый",
      "Тёино-коричневый",
      "Тёмно-серый"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3326637494")

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select1716930793",
    "maxSelect": 10,
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
      "Светлый",
      "Серый",
      "Золото-коричневый",
      "Кремовый",
      "Светло-бежевый",
      "Светло-Коричневый",
      "Светло-серый",
      "Серо-бежевый",
      "Тёино-коричневый",
      "Тёмно-серый"
    ]
  }))

  return app.save(collection)
})
