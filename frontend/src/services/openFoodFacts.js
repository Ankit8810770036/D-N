import api from './api';

export const fetchProductByBarcode = async (barcode) => {
    const cleanedBarcode = String(barcode || '').trim();
    if (!cleanedBarcode) {
        throw new Error('Please enter a valid barcode');
    }

    try {
        const response = await api.get(`/barcode/lookup/${cleanedBarcode}`);
        const data = response.data;
        if (!data) {
            throw new Error('No response from barcode service.');
        }

        return {
            found: data.found !== false,
            name: data.name || `Food #${cleanedBarcode}`,
            brand: data.brand || '',
            calories: Number(data.calories) || 0,
            protein: Number(data.protein) || 0,
            carbs: Number(data.carbs) || 0,
            fat: Number(data.fat) || 0,
            fiber: Number(data.fiber) || 0,
            serving_size: Number(data.serving_size) || 100,
            serving_unit: data.serving_unit || 'g',
            image_url: data.image_url || '',
            barcode: cleanedBarcode,
            is_veg: data.is_veg !== undefined ? Boolean(data.is_veg) : true,
            is_vegan: Boolean(data.is_vegan)
        };
    } catch (error) {
        console.error('Barcode Lookup Error:', error);
        throw new Error(
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            'Failed to lookup barcode.'
        );
    }
};
