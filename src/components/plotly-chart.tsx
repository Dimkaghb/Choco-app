'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Plotly to avoid SSR issues
let Plotly: any = null;
if (typeof window !== 'undefined') {
  import('plotly.js-dist-min').then((module) => {
    Plotly = module.default;
  });
}

interface PlotlyChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  type: 'bar' | 'line' | 'pie' | 'scatter';
  title?: string;
  className?: string;
}

export function PlotlyChart({ data, type, title, className }: PlotlyChartProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);

  useEffect(() => {
    // Load Plotly dynamically
    if (typeof window !== 'undefined' && !Plotly) {
      import('plotly.js-dist-min').then((module) => {
        Plotly = module.default;
        setPlotlyLoaded(true);
      }).catch((error) => {
        console.error('Failed to load Plotly:', error);
      });
    } else if (Plotly) {
      setPlotlyLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!plotRef.current || !data || data.length === 0 || !plotlyLoaded || !Plotly) return;

    const plotData = createPlotlyData(data, type);
    const layout = createPlotlyLayout(title, type);
    const config = {
      responsive: true,
      displayModeBar: false,
    };

    Plotly.newPlot(plotRef.current, plotData, layout, config).catch((error: any) => {
      console.error('Failed to create Plotly chart:', error);
    });

    return () => {
      if (plotRef.current) {
        Plotly.purge(plotRef.current);
      }
    };
  }, [data, type, title, plotlyLoaded]);

  return (
    <div className={`plotly-chart ${className || ''}`}>
      {!plotlyLoaded ? (
        <div 
          style={{ width: '100%', height: '400px' }} 
          className="flex items-center justify-center bg-gray-50 rounded-lg"
        >
          <div className="text-gray-500">Loading chart...</div>
        </div>
      ) : (
        <div ref={plotRef} style={{ width: '100%', height: '400px' }} />
      )}
    </div>
  );
}

function createPlotlyData(data: Array<{ label: string; value: number }>, type: string) {
  const labels = data.map(item => item.label);
  const values = data.map(item => item.value);

  switch (type) {
    case 'bar':
      return [{
        x: labels,
        y: values,
        type: 'bar',
        marker: {
          color: 'rgba(55, 128, 191, 0.7)',
          line: {
            color: 'rgba(55, 128, 191, 1.0)',
            width: 1
          }
        }
      }];

    case 'line':
      return [{
        x: labels,
        y: values,
        type: 'scatter',
        mode: 'lines+markers',
        line: {
          color: 'rgba(55, 128, 191, 1.0)',
          width: 2
        },
        marker: {
          color: 'rgba(55, 128, 191, 0.7)',
          size: 8
        }
      }];

    case 'pie':
      return [{
        labels: labels,
        values: values,
        type: 'pie',
        marker: {
          colors: [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
          ]
        }
      }];

    case 'scatter':
      return [{
        x: labels.map((_, index) => index),
        y: values,
        mode: 'markers',
        type: 'scatter',
        marker: {
          color: 'rgba(55, 128, 191, 0.7)',
          size: 10
        }
      }];

    default:
      return [{
        x: labels,
        y: values,
        type: 'bar'
      }];
  }
}

function createPlotlyLayout(title?: string, type?: string) {
  const baseLayout = {
    title: title || '',
    font: {
      family: 'Inter, system-ui, sans-serif',
      size: 12
    },
    margin: {
      l: 50,
      r: 50,
      t: title ? 50 : 20,
      b: 50
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
  };

  if (type === 'pie') {
    return {
      ...baseLayout,
      showlegend: true,
      legend: {
        orientation: 'v',
        x: 1.02,
        y: 0.5
      }
    };
  }

  return {
    ...baseLayout,
    xaxis: {
      gridcolor: 'rgba(128,128,128,0.2)',
      showgrid: true
    },
    yaxis: {
      gridcolor: 'rgba(128,128,128,0.2)',
      showgrid: true
    }
  };
}