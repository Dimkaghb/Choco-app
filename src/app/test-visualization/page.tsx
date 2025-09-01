'use client';

import { useState, useEffect } from 'react';
import { D3Visualization, type ChartData } from '@/components/d3-visualization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Utility functions to generate realistic data
const generateRevenueData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const baseRevenue = 45000;
  return months.map((month, index) => {
    // Seasonal business patterns: Q4 boost, summer dip, post-holiday drop
    const seasonalFactor = [0.9, 0.85, 1.0, 1.05, 1.1, 0.95, 0.9, 0.95, 1.0, 1.15, 1.25, 1.3][index];
    const trendGrowth = index * 800; // 2% month-over-month growth trend
    const randomVariation = (Math.random() * 6000) - 3000;
    const revenue = baseRevenue + trendGrowth + (baseRevenue * seasonalFactor * 0.2) + randomVariation;
    
    return {
      label: month,
      value: Math.round(Math.max(revenue, 20000)), // Ensure minimum revenue
      growth: index > 0 ? Math.round(((revenue - (baseRevenue + (index-1)*800)) / (baseRevenue + (index-1)*800)) * 100) : 0,
      target: Math.round(baseRevenue * 1.2 + index * 1000)
    };
  });
};

const generateStockData = () => {
  const startPrice = 120;
  let currentPrice = startPrice;
  const data = [];
  
  for (let day = 1; day <= 30; day++) {
    const change = (Math.random() - 0.5) * 8; // Random change between -4 and +4
    currentPrice += change;
    currentPrice = Math.max(100, Math.min(200, currentPrice)); // Keep within bounds
    data.push({ 
      x: day, 
      y: Math.round(currentPrice * 100) / 100 
    });
  }
  return data;
};

const generateUserEngagementData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let baseUsers = 85000;
  return months.map((month, index) => {
    // Seasonal effects: higher engagement in Nov-Dec, Jan, lower in summer
    const seasonalMultiplier = [1.1, 1.0, 0.95, 0.9, 0.85, 0.8, 0.8, 0.85, 0.9, 0.95, 1.05, 1.15][index];
    const growth = (Math.random() * 8000 + 2000) * seasonalMultiplier;
    baseUsers += growth;
    return {
      x: index + 1,
      y: Math.round(baseUsers),
      label: month,
      timestamp: `2024-${(index + 1).toString().padStart(2, '0')}-01`
    };
  });
};

const generateMarketShareData = () => {
  const platforms = [
    { label: 'Chrome', value: 65.2 },
    { label: 'Safari', value: 18.8 },
    { label: 'Edge', value: 4.3 },
    { label: 'Firefox', value: 3.2 },
    { label: 'Opera', value: 2.4 },
    { label: 'Other', value: 6.1 }
  ];
  return platforms;
};

const generateSalesData = () => {
  const industries = ['Tech', 'Retail', 'Healthcare', 'Finance', 'Education', 'Manufacturing'];
  const data = [];
  
  for (let i = 0; i < 30; i++) {
    const marketing = Math.random() * 50 + 10;
    // ROI varies by industry and marketing efficiency
    const industryMultiplier = 1.8 + Math.random() * 1.2;
    const efficiencyFactor = 0.8 + Math.random() * 0.4; // Marketing efficiency variance
    const sales = marketing * industryMultiplier * efficiencyFactor + Math.random() * 20;
    
    data.push({
      x: Math.round(marketing * 10) / 10,
      y: Math.round(sales * 10) / 10,
      size: Math.max(4, Math.min(14, Math.round(sales / 12))),
      roi: Math.round((sales / marketing) * 100) / 100,
      industry: industries[Math.floor(Math.random() * industries.length)]
    });
  }
  return data.sort((a, b) => a.x - b.x); // Sort by marketing spend
};

const generateAgeData = () => {
  const ages = [];
  // Generate realistic age distribution (normal distribution around 35)
  for (let i = 0; i < 100; i++) {
    const age = Math.round(35 + (Math.random() - 0.5) * 20 + (Math.random() - 0.5) * 10);
    if (age >= 18 && age <= 65) {
      ages.push({ value: age });
    }
  }
  return ages;
};

export default function TestVisualizationPage() {
  const [currentChart, setCurrentChart] = useState<ChartData | null>(null);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);

  // Generate sample charts with dynamic data
  const generateSampleCharts = (): { [key: string]: ChartData } => ({
    bar: {
      chartType: 'bar',
      title: 'Monthly Revenue Report 2024',
      xLabel: 'Month',
      yLabel: 'Revenue ($)',
      data: generateRevenueData(),
      options: { showGrid: true, animate: true }
    },
    line: {
      chartType: 'line',
      title: 'Stock Price Trend (30 Days)',
      xLabel: 'Trading Day',
      yLabel: 'Stock Price ($)',
      data: generateStockData(),
      options: { animate: true, showGrid: true }
    },
    pie: {
      chartType: 'pie',
      title: 'Browser Market Share 2024',
      data: generateMarketShareData(),
      options: { showLegend: true }
    },
    scatter: {
      chartType: 'scatter',
      title: 'Marketing ROI Analysis',
      xLabel: 'Marketing Spend ($1000s)',
      yLabel: 'Sales Revenue ($1000s)',
      data: generateSalesData()
    },
    area: {
      chartType: 'area',
      title: 'User Growth Trend',
      xLabel: 'Month',
      yLabel: 'Active Users',
      data: generateUserEngagementData(),
      options: { animate: true }
    },
    histogram: {
      chartType: 'histogram',
      title: 'Customer Age Demographics',
      xLabel: 'Age',
      yLabel: 'Count',
      data: generateAgeData()
    }
  });

  const [sampleCharts, setSampleCharts] = useState(generateSampleCharts());

  const refreshData = () => {
    setSampleCharts(generateSampleCharts());
    setDataRefreshKey(prev => prev + 1);
    // Update current chart if it's selected
    if (currentChart) {
      const newCharts = generateSampleCharts();
      const chartType = currentChart.chartType;
      const newChart = Object.values(newCharts).find(chart => chart.chartType === chartType);
      if (newChart) {
        setCurrentChart(newChart);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">D3.js Data Visualization Dashboard</h1>
        <p className="text-muted-foreground mb-4">
          Interactive charts with realistic, dynamically generated data
        </p>
        <Button 
          onClick={refreshData}
          variant="outline"
          className="mb-4"
        >
          🔄 Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {Object.entries(sampleCharts).map(([key, chartData]) => (
          <Button
            key={`${key}-${dataRefreshKey}`}
            variant={currentChart?.chartType === chartData.chartType ? "default" : "outline"}
            onClick={() => setCurrentChart(chartData)}
            className="capitalize"
          >
            {key}
          </Button>
        ))}
      </div>

      {currentChart && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{currentChart.title}</CardTitle>
            <CardDescription className="space-y-1">
              <div>Chart Type: <span className="font-medium capitalize">{currentChart.chartType}</span></div>
              <div>Data Points: <span className="font-medium">{currentChart.data.length}</span></div>
              {currentChart.xLabel && <div>X-Axis: <span className="font-medium">{currentChart.xLabel}</span></div>}
              {currentChart.yLabel && <div>Y-Axis: <span className="font-medium">{currentChart.yLabel}</span></div>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <D3Visualization chartData={currentChart} key={`chart-${dataRefreshKey}-${currentChart.chartType}`} />
          </CardContent>
        </Card>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>JSON Response Format</CardTitle>
          <CardDescription>
            Example of how the API should respond to trigger visualization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
{JSON.stringify({
  visualization: true,
  message: "Here is your requested chart:",
  chartData: currentChart || sampleCharts.bar
}, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Data Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <strong>📊 Bar Chart:</strong> Monthly revenue with Q4 seasonality, growth trends, and targets
            </div>
            <div className="text-sm">
              <strong>📈 Line Chart:</strong> 30-day stock volatility simulation with market dynamics
            </div>
            <div className="text-sm">
              <strong>🥧 Pie Chart:</strong> Browser market share with current 2024 distributions
            </div>
            <div className="text-sm">
              <strong>🎯 Scatter Plot:</strong> Marketing ROI by industry with efficiency correlations
            </div>
            <div className="text-sm">
              <strong>📈 Area Chart:</strong> Seasonal user engagement with monthly timestamps
            </div>
            <div className="text-sm">
              <strong>📊 Histogram:</strong> Customer demographics (normal age distribution)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <strong>1.</strong> API Response: Return JSON with <code>visualization: true</code>
            </p>
            <p className="text-sm">
              <strong>2.</strong> Chart Data: Include <code>chartData</code> object
            </p>
            <p className="text-sm">
              <strong>3.</strong> Types: bar, line, pie, scatter, area, histogram
            </p>
            <p className="text-sm">
              <strong>4.</strong> Dynamic: Use "Refresh Data" to see realistic variations
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
