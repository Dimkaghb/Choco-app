export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  isImage?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: FileAttachment[];
  timestamp: string | Date;
  visualization?: {
    enabled: boolean;
    chartData?: any;
  };
  plotlyChart?: {
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
    comment?: string;
  };
  // Support for multiple charts from new API format
  charts?: Array<{
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
    comment?: string;
  }>;
}

// Chat-related types
export interface Chat {
  id: string;
  title: string;
  user_id: string;
  session_id: string;
  created_at: string | Date;
  updated_at: string | Date;
  last_message_preview?: string;
  message_count?: number;
}

export interface ChatWithMessages extends Chat {
  messages: Message[];
}

export interface ChatCreate {
  title: string;
}

export interface ChatUpdate {
  title?: string;
}

export interface MessageCreate {
  role: 'user' | 'assistant';
  content: string;
  attachments?: FileAttachment[];
  visualization?: {
    enabled: boolean;
    chartData?: any;
  };
  plotlyChart?: {
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
    comment?: string;
  };
  // Support for multiple charts from new API format
  charts?: Array<{
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
    comment?: string;
  }>;
  // Backend uses snake_case
  plotly_chart?: {
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
    comment?: string;
  };
}
