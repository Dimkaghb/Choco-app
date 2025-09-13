'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

interface PlotlyChartProps {
  data: Array<{ 
    label: string; 
    value: number; 
    x?: number; 
    y?: number; 
    z?: number;
    stage?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    parent?: string;
    ids?: string;
  }>;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'histogram' | 'heatmap' | 'box' | 'violin' | 'waterfall' | 'funnel' | 'treemap' | 'sunburst' | 'candlestick' | 'gauge';
  title?: string;
  width?: number;
  height?: number;
  className?: string;
}

// Dynamically import the PlotlyChart component with no SSR
const DynamicPlotlyChart = dynamic(
  () => import('./plotly-chart').then((mod) => mod.PlotlyChart),
  {
    ssr: false,
    loading: () => (
      <div 
        style={{ width: '100%', height: '400px' }} 
        className="flex items-center justify-center bg-gray-50 rounded-lg"
      >
        <div className="text-gray-500">Loading chart...</div>
      </div>
    ),
  }
) as ComponentType<PlotlyChartProps>;

export { DynamicPlotlyChart as PlotlyChart };
export default DynamicPlotlyChart;