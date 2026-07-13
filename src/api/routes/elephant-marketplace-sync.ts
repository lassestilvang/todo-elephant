// Elephant Marketplace API - Scanning and Integration
// Handles marketplace data retrieval and synchronization

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Configuration
const API_ENDPOINTS = {
  amazon: 'https://api.amazon.com/',
  etsy: 'https://openapi.etsy.com/v2/'
};

const HEADERS = {
  amazon: {
    'Authorization': `Bearer ${process.env.AMAZON_API_KEY}`,
    'x-amz-access-token': process.env.AMAZON_ACCESS_TOKEN
  },
  etsy: {
    'x-api-key': process.env.ETSY_API_KEY,
    'x-api-app-key': process.env.ETSY_APP_KEY
  }
};

/**
 * Fetch product data from Amazon
 */
export const fetchAmazonProducts = async (query: string) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.amazon}products/search`, {
      headers: HEADERS.amazon,
      params: { k: query }
    });
    return response.data;
  } catch (error) {
    console.error('Amazon API error:', error);
    throw new Error('Amazon API request failed');
  }
};

/**
 * Fetch product data from Etsy
 */
export const fetchEtsyProducts = async (query: string) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.etsy} listings`, {
      headers: HEADERS.etsy,
      params: { q: query }
    });
    return response.data.results;
  } catch (error) {
    console.error('Etsy API error:', error);
    throw new Error('Etsy API request failed');
  }
};

/**
 * Process and normalize marketplace results
 */
export const processMarketplaceResults = (results: any) => {
  return results.map(product => ({
    id: product.id || product.asin,
    title: product.title || product.name,
    price: product.price?.amount || product.price,
    currency: product.currency || 'USD',
    url: product.detail_page_url || product.url,
    image: product.images?.[0]?.url,
    source: product.source || 'unknown',
    // Additional fields based on source
    ...(product.source === 'amazon' && {
      asin: product.asin,
      salesRank: product.salesRank
    }) || {}
  }));
};

export default {
  fetchAmazonProducts,
  fetchEtsyProducts,
  processMarketplaceResults
};