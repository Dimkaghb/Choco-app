'use client';

import { PlotlyChart } from '../../components/plotly-chart-wrapper';
import { extractChartFromResponse, removeChartFromResponse } from '@/lib/chart-extractor';
import { useState } from 'react';

const sampleData = [
  { label: "Kazakhstan", value: 1000 },
  { label: "Russia", value: 2000 },
  { label: "USA", value: 3000 },
  { label: "China", value: 2500 },
  { label: "Germany", value: 1800 }
];

const sampleJsonResponse = `{
  "chart": {
    "data": [
      { "label": "Kazakhstan", "value": 1000 },
      { "label": "Russia", "value": 2000 },
      { "label": "USA", "value": 3000 },
      { "label": "China", "value": 2500 },
      { "label": "Germany", "value": 1800 }
    ],
    "type": "bar",
    "title": "Country Statistics"
  },
  "message": "Here is the chart showing country statistics."
}`;

export default function TestPlotlyPage() {
  const [extractedChart, setExtractedChart] = useState<any>(null);
  const [cleanMessage, setCleanMessage] = useState<string>('');

  const testExtraction = () => {
    const chart = extractChartFromResponse(sampleJsonResponse);
    const message = removeChartFromResponse(sampleJsonResponse);
    setExtractedChart(chart);
    setCleanMessage(message);
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Plotly Chart Test Page</h1>
      
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Direct Chart Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Bar Chart</h3>
            <PlotlyChart 
              data={sampleData} 
              type="bar" 
              title="Sample Bar Chart"
              className="border rounded-lg p-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Line Chart</h3>
            <PlotlyChart 
              data={sampleData} 
              type="line" 
              title="Sample Line Chart"
              className="border rounded-lg p-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Pie Chart</h3>
            <PlotlyChart 
              data={sampleData} 
              type="pie" 
              title="Sample Pie Chart"
              className="border rounded-lg p-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Scatter Plot</h3>
            <PlotlyChart 
              data={sampleData} 
              type="scatter" 
              title="Sample Scatter Plot"
              className="border rounded-lg p-4"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Chart Extraction Test</h2>
        
        <div className="space-y-4">
          <h3 className="text-xl font-medium">Sample JSON Response</h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {sampleJsonResponse}
          </pre>
          
          <button 
            onClick={testExtraction}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Chart Extraction
          </button>
          
          {extractedChart && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Extracted Chart</h4>
              <PlotlyChart 
                data={extractedChart.data} 
                type={extractedChart.type} 
                title={extractedChart.title}
                className="border rounded-lg p-4"
              />
              
              <h4 className="text-lg font-medium">Clean Message</h4>
              <div className="bg-gray-100 p-4 rounded-lg">
                {cleanMessage}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}