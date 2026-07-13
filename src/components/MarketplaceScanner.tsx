import React, { useState, useEffect } from 'react';
import { Grid, Typography, Button } from '@mui/material';
import { fetchEtsyProducts, fetchAmazonProducts } from '@/api/routes/elephant-marketplace-sync';

const MarketplaceScanner = ({ productsToScan }) => {
  const [scannedProducts, setScannedProducts] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!productsToScan.length) return cancel;

    const cancel = useCallback(() => {
      setScannedProducts([]);
    }, []);

    fetchEtsyProducts(productsToScan.join(','))
      .then(results => setScannedProducts(results))
      .catch(error => setErrorMessage('Etsy API failed: ' + error.message));

    fetchAmazonProducts(productsToScan.join(','))
      .then(results => setScannedProducts([...scannedProducts, ...results]))
      .catch(error => setErrorMessage('Amazon API failed: ' + error.message));
  }, [productsToScan]);

  return (
    <div>
      <Typography variant="h6">Scanning Products...</Typography>
      {errorMessage && <p style="color:red">{errorMessage}</p>}
      <Grid container spacing={2}>
        {scannedProducts.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4}>
            <div className="product-card"
                 style="{
                   backgroundColor: product.source === 'ams' ? '#f0f8ff' : '#e0f7fa',
                   border: '1px solid #ddd',
                   padding: '10px'
                 }">
              <img src={product.image} alt={product.title} style="width:100px; height:100px" />
              <Typography variant="body2" component="div"
                   style="margin: 10px 0 5px 0; color:{product.source === 'ams' ? '#1a73e8' : '#43a047'}">
                {product.source === 'etsy' ? 'Etsy' : 'Amazon'}
              </Typography>
              <Typography variant="body1">
                {product.title}
              </Typography>
              <Typography variant="caption">
                ${product.price} {product.currency}
              </Typography>
            </div>
          </Grid>
        ))}
      </Grid>
      <Button onClick={() => setProductsToScan([])}
              variant="contained"
              color="primary"
              disabled={!productsToScan.length}
      >{productsToScan.length ? 'Start Scanning' : 'Cancel'}</Button>
    </div>
  );
};

export default MarketplaceScanner;