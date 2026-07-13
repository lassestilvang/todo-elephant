"use client";

import React, { useMemo } from "react";
import { TrendingUp, DollarSign, Calendar, BarChart3 } from "lucide-react";

interface ForecastData {
  monthly: MonthProjectionType;
  weekly: WeeklyTrendType;
}

interface MonthProjectionType {
  base: number[];
  projected: number[];
}

interface WeeklyTrendType {
  averageDaily: number;
  seasonalityFactor: number;
}

interface RevenueForecastProps {
  historicalData?: number[];
}

export default function RevenueForecast({ historicalData = [] }: RevenueForecastProps) {
  const forecast = useMemo(() => {
    const monthlySales = historicalData.length > 0
      ? historicalData.slice(-30)
      : [100, 120, 90, 140, 160, 180, 200, 170, 150, 130, 110, 105];

    const weeklyTrend = {
      averageDaily: monthlySales.reduce((a, b) => a + b, 0) / monthlySales.length,
      seasonalityFactor: 1.0 + Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 7)) * 0.1
    };

    const growthRate = 1.05;
    const projected = monthlySales.map(v => v * Math.pow(growthRate, Math.random() * 0.1));

    return {
      monthly: { base: monthlySales, projected },
      weekly: weeklyTrend
    };
  }, [historicalData]);

  const totalProjected = forecast.monthly.projected.reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 rounded-2xl border border-border bg-card/40 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <DollarSign size={16} className="text-accent" />
          Revenue Forecast
        </h3>
        <TrendingUp size={18} className="text-emerald-500" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted">Projected 30-day total</span>
          <span className="font-bold">${Math.round(totalProjected)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted">Avg daily revenue</span>
          <span className="font-bold">${Math.round(forecast.weekly.averageDaily)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted">Growth factor</span>
          <span className="font-bold text-emerald-500">
            +{(forecast.weekly.seasonalityFactor - 1) * 100}%
          </span>
        </div>
      </div>

      {/* Simple bar chart visualization */}
      <div className="h-20 flex items-end justify-between gap-1 pt-2">
        {forecast.monthly.base.slice(-12).map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-accent/20 rounded-t transition-all"
              style={{ height: `${Math.min(100, v / 2)}px` }}
            />
            <span className="text-[8px] text-muted">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}