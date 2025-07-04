import ProductServices from "@services/ProductServices";
import CategoryServices from "@services/CategoryServices";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ message: 'Query must be at least 2 characters' });
  }

  try {
    // Search for products and categories
    const [productsData, categoriesData] = await Promise.all([
      ProductServices.getShowingStoreProducts({
        title: encodeURIComponent(q),
        limit: 5
      }),
      CategoryServices.getShowingCategory()
    ]);

    const suggestions = [];

    // Add product titles
    if (productsData?.products) {
      productsData.products.forEach(product => {
        if (product.title && product.title.toLowerCase().includes(q.toLowerCase())) {
          suggestions.push(product.title);
        }
      });
    }

    // Add category names
    if (categoriesData) {
      const categories = Array.isArray(categoriesData) ? categoriesData : categoriesData.categories || [];
      categories.forEach(category => {
        if (category.name && category.name.toLowerCase().includes(q.toLowerCase())) {
          suggestions.push(category.name);
        }
      });
    }

    // Remove duplicates and limit to 8 suggestions
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 8);

    res.status(200).json({ suggestions: uniqueSuggestions });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 