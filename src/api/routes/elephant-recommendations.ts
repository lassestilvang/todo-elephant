import { NextApiRequest, NextApiResponse } from 'next';
import { fetchEtsyProducts, fetchAmazonProducts } from '@/api/routes/elephant-marketplace-sync';
import { ElephantPropertyMatcher } from '@/components/RevenueForecast';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query required'
      });
    }

    // Get matching products from marketplaces
    const stores = ['etsy', 'amazon'];
    const allProducts = await Promise.all(stores.map(store => {
      return fetchEtsyProducts(store) // Unified API call
            .then(results => ({ store, results }))
            .catch(error => ({ store, error: error.message }));
    }));

    // Initialize recommender
    const matcher = new ElephantPropertyMatcher();
    const recommendations = [];

    // Process each store's results
    for (const { store, results, error } of allProducts) {
      if (error) {
        console.error(`Error from ${store}:`, error);
        continue;
      }

      for (const product of results) {
        const scores = await matcher.generateMatchScores(product, JSON.parse(req.body.preferences || '{}'));
        if (scores > 0.6) { // 60% threshold for relevance
          recommendations.push({
            ...product,
            store,
            relevanceScore: scores
          });
        }
      }
    }

    // Sort by relevance score
    recommendations.sort((a, b) => b.relevanceScore! - a.relevanceScore!);

    res.status(200).json({
      success: true,
      recommendations,
      totalResults: recommendations.length
    });
  } catch (error) {
    console.error('Recommendation API error:', error);
    res.status(500).json({
      success: false,
      error: 'Recommendation generation failed'
    });
  }
};

export default handler;