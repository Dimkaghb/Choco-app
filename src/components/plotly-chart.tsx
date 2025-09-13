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

export interface PlotlyChartProps {
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

    case 'area':
      return [{
        x: labels,
        y: values,
        type: 'scatter',
        mode: 'lines',
        fill: 'tonexty',
        fillcolor: 'rgba(55, 128, 191, 0.3)',
        line: {
          color: 'rgba(55, 128, 191, 1.0)',
          width: 2
        }
      }];

    case 'histogram':
      return [{
        x: values,
        type: 'histogram',
        marker: {
          color: 'rgba(55, 128, 191, 0.7)',
          line: {
            color: 'rgba(55, 128, 191, 1.0)',
            width: 1
          }
        }
      }];

    case 'heatmap':
      const size = Math.ceil(Math.sqrt(values.length));
      const zData = [];
      for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
          const index = i * size + j;
          row.push(index < values.length ? values[index] : 0);
        }
        zData.push(row);
      }
      return [{
        z: zData,
        type: 'heatmap',
        colorscale: 'Viridis'
      }];

    case 'box':
      return [{
        y: values,
        type: 'box',
        name: 'Box Plot',
        marker: {
          color: 'rgba(55, 128, 191, 0.7)'
        }
      }];

    case 'violin':
      return [{
        y: values,
        type: 'violin',
        name: 'Violin Plot',
        box: { visible: true },
        meanline: { visible: true },
        marker: {
          color: 'rgba(55, 128, 191, 0.7)'
        }
      }];

    case 'waterfall':
      return [{
        type: 'waterfall',
        x: labels,
        y: values,
        measure: data.map((_, i) => i === 0 ? 'absolute' : 'relative'),
        connector: { line: { color: 'rgb(63, 63, 63)' } }
      }];

    case 'funnel':
      return [{
        type: 'funnel',
        y: data.map(d => d.stage || d.label || ''),
        x: data.map(d => d.value || 0),
        textinfo: 'label+percent initial',
        marker: {
          color: data.map((_, i) => `hsl(${i * 360 / data.length}, 70%, 50%)`)
        }
      }];

    case 'treemap':
      return [{
        type: 'treemap',
        labels: labels,
        values: values,
        parents: data.map(d => d.parent || ''),
        textinfo: 'label+value+percent parent'
      }];

    case 'sunburst':
      return [{
        type: 'sunburst',
        labels: labels,
        values: values,
        parents: data.map(d => d.parent || ''),
        ids: data.map(d => d.ids || d.label)
      }];

    case 'candlestick':
      return [{
        type: 'candlestick',
        x: labels,
        open: data.map(d => d.open || d.value * 0.9),
        high: data.map(d => d.high || d.value * 1.1),
        low: data.map(d => d.low || d.value * 0.8),
        close: data.map(d => d.close || d.value),
        increasing: { line: { color: '#00CC96' } },
        decreasing: { line: { color: '#EF553B' } }
      }];

    case 'gauge':
      const gaugeValue = data.length > 0 ? data[0].value : 0;
      return [{
        type: 'indicator',
        mode: 'gauge+number+delta',
        value: gaugeValue,
        domain: { x: [0, 1], y: [0, 1] },
        title: { text: data.length > 0 ? data[0].label : 'Gauge' },
        gauge: {
          axis: { range: [null, 100] },
          bar: { color: 'darkblue' },
          steps: [
            { range: [0, 50], color: 'lightgray' },
            { range: [50, 85], color: 'gray' }
          ],
          threshold: {
            line: { color: 'red', width: 4 },
            thickness: 0.75,
            value: 90
          }
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

  if (type === 'heatmap') {
    return {
      ...baseLayout,
      xaxis: {
        showgrid: false,
        zeroline: false,
        showticklabels: false
      },
      yaxis: {
        showgrid: false,
        zeroline: false,
        showticklabels: false
      }
    };
  }

  if (type === 'box' || type === 'violin') {
    return {
      ...baseLayout,
      xaxis: {
        showgrid: false,
        zeroline: false
      },
      yaxis: {
        gridcolor: 'rgba(128,128,128,0.2)',
        showgrid: true,
        zeroline: false
      }
    };
  }

  if (type === 'histogram') {
    return {
      ...baseLayout,
      xaxis: {
        title: 'Value',
        gridcolor: 'rgba(128,128,128,0.2)',
        showgrid: true
      },
      yaxis: {
        title: 'Frequency',
        gridcolor: 'rgba(128,128,128,0.2)',
        showgrid: true
      }
    };
  }

  if (type === 'waterfall') {
    return {
      ...baseLayout,
      xaxis: {
        title: 'Categories',
        gridcolor: 'rgba(128,128,128,0.2)',
        showgrid: true
      },
      yaxis: {
        title: 'Values',
        gridcolor: 'rgba(128,128,128,0.2)',
        showgrid: true
      },
      waterfallgap: 0.3
    };
  }

  if (type === 'funnel') {
    return {
      ...baseLayout,
      showlegend: false,
      margin: {
        ...baseLayout.margin,
        l: 150
      }
    };
  }

  if (type === 'treemap') {
    return {
      ...baseLayout,
      margin: {
        t: title ? 50 : 20,
        l: 25,
        r: 25,
        b: 25
      }
    };
  }

  if (type === 'sunburst') {
    return {
      ...baseLayout,
      margin: {
        t: title ? 50 : 20,
        l: 0,
        r: 0,
        b: 0
      }
    };
  }

  if (type === 'candlestick') {
    return {
      ...baseLayout,
      xaxis: {
        title: 'Time/Categories',
        rangeslider: { visible: false },
        gridcolor: 'rgba(128,128,128,0.2)',
        showgrid: true
      },
      yaxis: {
        title: 'Price',
        gridcolor: 'rgba(128,128,128,0.2)',
        showgrid: true
      }
    };
  }

  if (type === 'gauge') {
    return {
      ...baseLayout,
      margin: {
        t: 100,
        r: 50,
        l: 50,
        b: 50
      },
      showlegend: false
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