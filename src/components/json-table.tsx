import React from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface JsonTableProps {
  data: any[];
  title?: string;
  message?: {
    type: 'success' | 'error' | 'warning' | 'info';
    content: string;
  };
  className?: string;
  maxRows?: number;
  showRowNumbers?: boolean;
}

interface TableColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

const getValueType = (value: any): string => {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value;
};

const formatValue = (value: any): React.ReactNode => {
  const type = getValueType(value);
  
  switch (type) {
    case 'null':
      return <Badge variant="secondary" className="text-white">null</Badge>;
    case 'boolean':
      return (
        <Badge variant={value ? 'default' : 'secondary'} className="text-white">
          {value ? 'true' : 'false'}
        </Badge>
      );
    case 'number':
      return <span className="font-mono text-white">{value}</span>;
    case 'string':
      return <span className="text-white">{value}</span>;
    case 'array':
      return (
        <Badge variant="outline" className="text-white border-white">
          Array[{value.length}]
        </Badge>
      );
    case 'object':
      return (
        <Badge variant="outline" className="text-white border-white">
          Object({Object.keys(value).length} keys)
        </Badge>
      );
    default:
      return <span className="text-white">{String(value)}</span>;
  }
};

const extractColumns = (data: any[]): TableColumn[] => {
  if (!data || data.length === 0) return [];
  
  const allKeys = new Set<string>();
  data.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => allKeys.add(key));
    }
  });
  
  return Array.from(allKeys).map(key => {
    // Определяем тип на основе первого не-null значения
    let type: TableColumn['type'] = 'string';
    for (const item of data) {
      if (item && typeof item === 'object' && item[key] != null) {
        const valueType = getValueType(item[key]);
        if (valueType === 'number') type = 'number';
        else if (valueType === 'boolean') type = 'boolean';
        else if (valueType === 'array') type = 'array';
        else if (valueType === 'object') type = 'object';
        break;
      }
    }
    
    return {
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      type
    };
  });
};

const getMessageIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-4 w-4" />;
    case 'error':
      return <AlertCircle className="h-4 w-4" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4" />;
    case 'info':
    default:
      return <Info className="h-4 w-4" />;
  }
};

export function JsonTable({
  data,
  title = 'Данные таблицы',
  message,
  className,
  maxRows = 100,
  showRowNumbers = true
}: JsonTableProps) {
  if (!data || !Array.isArray(data)) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Неверный формат данных. Ожидается массив объектов.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-white">
              Нет данных для отображения.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const columns = extractColumns(data);
  const displayData = data.slice(0, maxRows);
  const hasMoreRows = data.length > maxRows;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>{title}</span>
          <Badge variant="secondary" className="text-white">
            {data.length} {data.length === 1 ? 'запись' : 'записей'}
          </Badge>
        </CardTitle>
        
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            {getMessageIcon(message.type)}
            <AlertDescription className="text-white">{message.content}</AlertDescription>
          </Alert>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {showRowNumbers && (
                  <TableHead className="w-16 text-center text-white border-r border-gray-600">#</TableHead>
                )}
                {columns.map((column) => (
                  <TableHead key={column.key} className="font-semibold text-white border-r border-gray-600">
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, index) => (
                <TableRow key={index} className="hover:bg-muted/50 border-b border-gray-600">
                  {showRowNumbers && (
                    <TableCell className="text-center text-white font-mono border-r border-gray-600">
                      {index + 1}
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key} className="text-white border-r border-gray-600">
                      {formatValue(row?.[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {hasMoreRows && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-white">
              Показано {maxRows} из {data.length} записей. 
              Остальные {data.length - maxRows} записей скрыты.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default JsonTable;