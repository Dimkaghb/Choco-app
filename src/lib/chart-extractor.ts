/**
 * Extracts chart JSON data from API response text
 * Looks for JSON objects with 'chart' property containing 'data' and 'type' fields
 */
export interface ChartData {
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
}

export function extractChartFromResponse(responseText: string): ChartData | null {
  // Ensure responseText is a string
  if (typeof responseText !== 'string') {
    return null;
  }
  
  try {
    // First, try to parse the entire response as JSON
    const parsed = JSON.parse(responseText);
    
    // Check if the response has a direct chart property
    if (parsed.chart && isValidChartData(parsed.chart)) {
      return parsed.chart;
    }
    
    // Check if the response itself is a chart object
    if (isValidChartData(parsed)) {
      return parsed;
    }
    
    return null;
  } catch (error) {
    // If full JSON parsing fails, try to extract JSON from text
    return extractChartFromText(responseText);
  }
}

function extractChartFromText(text: string): ChartData | null {
  // Ensure text is a string
  if (typeof text !== 'string') {
    return null;
  }
  
  // Look for JSON objects in the text using regex
  const jsonRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  const matches = text.match(jsonRegex);
  
  if (!matches) return null;
  
  for (const match of matches) {
    try {
      const parsed = JSON.parse(match);
      
      // Check if this JSON object has chart data
      if (parsed.chart && isValidChartData(parsed.chart)) {
        return parsed.chart;
      }
      
      // Check if this JSON object is itself chart data
      if (isValidChartData(parsed)) {
        return parsed;
      }
    } catch (error) {
      // Continue to next match if parsing fails
      continue;
    }
  }
  
  return null;
}

function isValidChartData(obj: any): obj is ChartData {
  const validTypes = ['bar', 'line', 'pie', 'scatter', 'area', 'histogram', 'heatmap', 'box', 'violin', 'waterfall', 'funnel', 'treemap', 'sunburst', 'candlestick', 'gauge'];
  
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.data) &&
    obj.data.length > 0 &&
    obj.data.every((item: any) => 
      item &&
      typeof item === 'object' &&
      typeof item.label === 'string' &&
      typeof item.value === 'number'
    ) &&
    typeof obj.type === 'string' &&
    validTypes.includes(obj.type)
  );
}

/**
 * Removes chart JSON from response text to get clean message content
 */
export function removeChartFromResponse(responseText: string): string {
  // Ensure responseText is a string
  if (typeof responseText !== 'string') {
    return String(responseText || '');
  }
  
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(responseText);
    
    if (parsed.chart) {
      // If there's a chart property, remove it and return remaining content
      const { chart, ...rest } = parsed;
      
      // If there's a message or text field, return that
      if (rest.message) return rest.message;
      if (rest.text) return rest.text;
      if (rest.content) return rest.content;
      
      // If there are other fields, stringify them
      const remainingKeys = Object.keys(rest);
      if (remainingKeys.length > 0) {
        return JSON.stringify(rest, null, 2);
      }
      
      return 'Chart data processed successfully.';
    }
    
    // If the entire response is chart data, return a default message
    if (isValidChartData(parsed)) {
      return 'Here is your requested chart:';
    }
    
    // Return original if no chart found
    return responseText;
  } catch (error) {
    // If not JSON, try to remove JSON objects that contain chart data
    const jsonRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    let cleanText = responseText;
    
    const matches = responseText.match(jsonRegex);
    if (matches) {
      for (const match of matches) {
        try {
          const parsed = JSON.parse(match);
          if (parsed.chart && isValidChartData(parsed.chart)) {
            cleanText = cleanText.replace(match, '').trim();
          } else if (isValidChartData(parsed)) {
            cleanText = cleanText.replace(match, '').trim();
          }
        } catch (error) {
          // Continue if parsing fails
          continue;
        }
      }
    }
    
    return cleanText || 'Chart data processed successfully.';
  }
}