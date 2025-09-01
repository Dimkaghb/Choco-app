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
  role: 'user' | 'ai';
  content: string;
  image?: string; // Deprecated: use attachments instead
  attachments?: FileAttachment[];
  timestamp: Date;
  visualization?: {
    enabled: boolean;
    chartData?: {
      chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'histogram';
      data: any[];
      title?: string;
      xLabel?: string;
      yLabel?: string;
      width?: number;
      height?: number;
      colors?: string[];
      options?: {
        showGrid?: boolean;
        showLegend?: boolean;
        animate?: boolean;
        margin?: { top: number; right: number; bottom: number; left: number };
      };
    };
  };
  plotlyChart?: {
    data: Array<{
      label: string;
      value: number;
    }>;
    type: 'bar' | 'line' | 'pie' | 'scatter';
    title?: string;
  };
}
