"use client";

import React, { useState, useEffect } from "react";
import { Search, ExternalLink, ShoppingCart } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  image: string;
  source: string;
}

interface MarketplaceScannerProps {
  productsToScan?: string;
}

export default function MarketplaceScanner({ productsToScan = "" }: MarketplaceScannerProps) {
  const [scannedProducts, setScannedProducts] = useState<Product[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!productsToScan) return;

    const keywords = productsToScan.split(",");
    if (!keywords.length) return;

    const scan = async () => {
      setIsScanning(true);
      setErrorMessage("");
      const results: Product[] = [];

      // Simulate scanning (in production, would call real APIs)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock results for demo
      results.push({
        id: "demo-1",
        title: `Elephant ${keywords[0] || "Product"}`,
        price: 29.99,
        currency: "USD",
        url: "#",
        image: "https://placehold.co/100x100?text=Elephant",
        source: "etsy"
      });

      setScannedProducts(results);
      setIsScanning(false);
    };

    scan();
  }, [productsToScan]);

  if (isScanning) {
    return (
      <div className="p-6 rounded-2xl border border-border bg-card/40 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm text-muted">Scanning marketplace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search size={20} className="text-accent" />
        <h3 className="font-bold text-sm">Marketplace Scanner</h3>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
          {errorMessage}
        </div>
      )}

      {scannedProducts.length === 0 ? (
        <div className="p-8 rounded-2xl border border-border bg-card/25 text-center">
          <ShoppingCart size={48} className="text-muted/30 mx-auto mb-2" />
          <p className="text-sm text-muted">Enter search keywords to scan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scannedProducts.map((product) => (
            <div
              key={product.id}
              className="p-3 rounded-xl border border-border bg-card/40 space-y-2"
            >
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-24 object-cover rounded-lg"
              />
              <h4 className="font-bold text-xs line-clamp-2">{product.title}</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">
                  ${product.price} {product.currency}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  product.source === 'etsy' ? 'bg-pink-500/20 text-pink-500' : 'bg-blue-500/20 text-blue-500'
                }`}>
                  {product.source === 'etsy' ? 'Etsy' : 'Amazon'}
                </span>
              </div>
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-accent hover:underline"
              >
                View Product
                <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}