'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

interface PlotlyChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  type: 'bar' | 'line' | 'pie' | 'scatter';
  title?: string;
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