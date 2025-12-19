/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3326637494")

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select2363381545",
    "maxSelect": 1,
    "name": "type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Стандарт",
      "Узкая",
      "Широкая"
    ]
  }))

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

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select868071530",
    "maxSelect": 1,
    "name": "thickness",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "12",
      "10",
      "9.5",
      "9",
      "8"
    ]
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select1716930793",
    "maxSelect": 2,
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
  collection.fields.addAt(6, new Field({
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

  // update field
  collection.fields.addAt(7, new Field({
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

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select868071530",
    "maxSelect": 1,
    "name": "style",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Классика",
      "Модерн",
      "Лофт",
      "Минимализм"
    ]
  }))

  // update field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "select1716930793",
    "maxSelect": 2,
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
      "Чёрный"
    ]
  }))

  return app.save(collection)
})
