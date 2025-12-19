/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1579384326",
        "max": 0,
        "min": 0,
        "name": "name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1843675174",
        "max": 0,
        "min": 0,
        "name": "description",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2148151432",
        "max": 0,
        "min": 0,
        "name": "prise",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "file383471497",
        "maxSelect": 99,
        "maxSize": 0,
        "mimeTypes": [],
        "name": "picture",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": [],
        "type": "file"
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      }
    ],
    "id": "pbc_3326637494",
    "indexes": [],
    "listRule": null,
    "name": "laminates",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3326637494");

  return app.delete(collection);
})
