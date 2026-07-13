import { NextRequest, NextResponse } from 'next/server';
import { fetchEtsyProducts, fetchAmazonProducts } from './elephant-marketplace-sync';

// Calculate relevance score based on simple matching
function calculateRelevance(product: any, query: string): number {
  const titleMatch = product.title?.toLowerCase().includes(query.toLowerCase()) ? 0.5 : 0;
  const tagMatch = product.styleTags?.some((tag: string) =>
    tag.toLowerCase().includes(query.toLowerCase())
  ) ? 0.3 : 0;
  const descriptionMatch = product.description?.toLowerCase().includes(query.toLowerCase()) ? 0.2 : 0;
  return titleMatch + tagMatch + descriptionMatch;
}

// GET endpoint - get recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Search query required'
      }, { status: 400 });
    }

    // Get matching products from marketplaces (simulated)
    const allProducts: any[] = [];

    try {
      const etsyResults = await fetchEtsyProducts(query);
      allProducts.push(...etsyResults.map((p: any) => ({ ...p, store: 'etsy' })));
    } catch (error) {
      console.error('Etsy fetch error:', error);
    }

    try {
      const amazonResults = await fetchAmazonProducts(query);
      allProducts.push(...amazonResults.map((p: any) => ({ ...p, store: 'amazon' })));
    } catch (error) {
      console.error('Amazon fetch error:', error);
    }

    // Calculate relevance scores
    const recommendations = allProducts
      .map((product) => ({
        ...product,
        relevanceScore: calculateRelevance(product, query)
      }))
      .filter((p) => p.relevanceScore > 0.3)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    return NextResponse.json({
      success: true,
      recommendations,
      totalResults: recommendations.length
    });
  } catch (error) {
    console.error('Recommendation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Recommendation generation failed'
    }, { status: 500 });
  }
}