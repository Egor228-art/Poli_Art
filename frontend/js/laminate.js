// Пример функции для загрузки ламината
async function loadLaminateProducts(page = 1) {
    try {
        const result = await pb.collection('laminate').getList(page, ITEMS_PER_PAGE, {
            filter: buildLaminateFilterQuery(),
            sort: '-created'
        });
        
        // Аналогичная логика рендеринга...
    } catch (error) {
        console.error('Ошибка загрузки ламината:', error);
    }
}