import axios from 'axios';

const OFF_BASE_URL = 'https://world.openfoodfacts.org/api/v2';

export const fetchProductByBarcode = async (barcode) => {
    try {
        const response = await axios.get(`${OFF_BASE_URL}/product/${barcode}.json`);

        if (response.data.status === 0) {
            throw new Error('Product not found');
        }

        const product = response.data.product;

        // Map OpenFoodFacts data to our internal format
        // Off usually provides values per 100g
        return {
            name: product.product_name || 'Unknown Product',
            brand: product.brands || '',
            calories: product.nutriments['energy-kcal_100g'] || (product.nutriments['energy_100g'] / 4.184) || 0,
            protein: product.nutriments.proteins_100g || 0,
            carbs: product.nutriments.carbohydrates_100g || 0,
            fat: product.nutriments.fat_100g || 0,
            serving_size: 100,
            serving_unit: 'g',
            image_url: product.image_url || '',
            barcode: barcode
        };
    } catch (error) {
        console.error('OpenFoodFacts Error:', error);
        throw error;
    }
};
