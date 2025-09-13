'use client';

import { PlotlyChart } from '../../components/plotly-chart-wrapper';
import { extractChartFromResponse, removeChartFromResponse } from '@/lib/chart-extractor';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [customJson, setCustomJson] = useState<string>(JSON.stringify({
    "type": "funnel",
    "data": [
      { "stage": "Посетители сайта", "value": 5000 },
      { "stage": "Регистрация", "value": 3200 },
      { "stage": "Активация аккаунта", "value": 2500 },
      { "stage": "Добавили товар в корзину", "value": 1800 },
      { "stage": "Оформили заказ", "value": 1200 },
      { "stage": "Оплатили заказ", "value": 950 }
    ]
  }, null, 2));
  const [customChartData, setCustomChartData] = useState<any>(null);
  const [customChartType, setCustomChartType] = useState<string>('bar');
  const [jsonError, setJsonError] = useState<string>('');

  const testExtraction = () => {
    const chart = extractChartFromResponse(sampleJsonResponse);
    const message = removeChartFromResponse(sampleJsonResponse);
    setExtractedChart(chart);
    setCleanMessage(message);
  };

  const handleCustomJsonTest = () => {
    try {
      const parsedData = JSON.parse(customJson);
      if (parsedData && typeof parsedData === 'object' && parsedData.type && parsedData.data) {
        if (Array.isArray(parsedData.data)) {
          setCustomChartData(parsedData.data);
          setCustomChartType(parsedData.type);
          setJsonError('');
        } else {
          setJsonError('Поле data должно быть массивом объектов с полями label и value');
        }
      } else {
        setJsonError('JSON должен быть объектом с полями type и data');
      }
    } catch (error) {
      setJsonError('Неверный формат JSON');
    }
  };

  const fillSampleJson = () => {
    const sampleExamples = {
      bar: { type: 'bar', data: sampleData },
      waterfall: {
        type: 'waterfall',
        data: [
          { label: "Начальное значение", value: 100 },
          { label: "Увеличение 1", value: 20 },
          { label: "Уменьшение 1", value: -15 },
          { label: "Увеличение 2", value: 25 }
        ]
      },
      funnel: {
        type: 'funnel',
        data: [
          { stage: "Посетители", value: 1000 },
          { stage: "Интерес", value: 800 },
          { stage: "Рассмотрение", value: 400 },
          { stage: "Покупка", value: 120 }
        ]
      },
      treemap: {
        type: 'treemap',
        data: [
          { label: "Корень", value: 100, parent: "" },
          { label: "Категория A", value: 60, parent: "Корень" },
          { label: "Категория B", value: 40, parent: "Корень" },
          { label: "Подкатегория A1", value: 35, parent: "Категория A" },
          { label: "Подкатегория A2", value: 25, parent: "Категория A" }
        ]
      },
      candlestick: {
        type: 'candlestick',
        data: [
          { label: "День 1", value: 100, open: 95, high: 105, low: 90, close: 100 },
          { label: "День 2", value: 110, open: 100, high: 115, low: 98, close: 110 },
          { label: "День 3", value: 105, open: 110, high: 112, low: 102, close: 105 }
        ]
      },
      gauge: {
        type: 'gauge',
        data: [{ label: "KPI", value: 75 }]
      }
    };
    
    const randomExample = Object.values(sampleExamples)[Math.floor(Math.random() * Object.values(sampleExamples).length)];
    setCustomJson(JSON.stringify(randomExample, null, 2));
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
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Area Chart</h3>
            <PlotlyChart 
              data={sampleData} 
              type="area" 
              title="Sample Area Chart"
              className="border rounded-lg p-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Histogram</h3>
            <PlotlyChart 
              data={sampleData} 
              type="histogram" 
              title="Sample Histogram"
              className="border rounded-lg p-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Heatmap</h3>
            <PlotlyChart 
              data={sampleData} 
              type="heatmap" 
              title="Sample Heatmap"
              className="border rounded-lg p-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Box Plot</h3>
            <PlotlyChart 
              data={sampleData} 
              type="box" 
              title="Sample Box Plot"
              className="border rounded-lg p-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Violin Plot</h3>
            <PlotlyChart 
              data={sampleData} 
              type="violin" 
              title="Sample Violin Plot"
              className="border rounded-lg p-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Waterfall Chart</h3>
            <PlotlyChart 
              data={[
                { label: "Начальное значение", value: 100 },
                { label: "Увеличение 1", value: 20 },
                { label: "Уменьшение 1", value: -15 },
                { label: "Увеличение 2", value: 25 },
                { label: "Итоговое значение", value: 130 }
              ]}
              type="waterfall" 
              title="Анализ изменений показателей"
              className="border rounded-lg p-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Funnel Chart</h3>
            <PlotlyChart 
              data={[
                { label: "Посетители сайта", value: 1000 },
                { label: "Просмотры товаров", value: 800 },
                { label: "Добавления в корзину", value: 400 },
                { label: "Начало оформления", value: 200 },
                { label: "Завершенные покупки", value: 120 }
              ]}
              type="funnel" 
              title="Воронка продаж"
              className="border rounded-lg p-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Treemap</h3>
            <PlotlyChart 
              data={[
                { label: "Технологии", value: 100, parent: "" },
                { label: "Frontend", value: 60, parent: "Технологии" },
                { label: "Backend", value: 40, parent: "Технологии" },
                { label: "React", value: 35, parent: "Frontend" },
                { label: "Vue", value: 25, parent: "Frontend" },
                { label: "Node.js", value: 25, parent: "Backend" },
                { label: "Python", value: 15, parent: "Backend" }
              ]}
              type="treemap" 
              title="Распределение технологий"
              className="border rounded-lg p-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Sunburst Chart</h3>
            <PlotlyChart 
              data={[
                { label: "Продажи", value: 100, parent: "", ids: "sales" },
                { label: "Онлайн", value: 60, parent: "Продажи", ids: "online" },
                { label: "Офлайн", value: 40, parent: "Продажи", ids: "offline" },
                { label: "Мобильные", value: 35, parent: "Онлайн", ids: "mobile" },
                { label: "Десктоп", value: 25, parent: "Онлайн", ids: "desktop" },
                { label: "Магазины", value: 30, parent: "Офлайн", ids: "stores" },
                { label: "Партнеры", value: 10, parent: "Офлайн", ids: "partners" }
              ]}
              type="sunburst" 
              title="Структура продаж по каналам"
              className="border rounded-lg p-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Candlestick Chart</h3>
            <PlotlyChart 
              data={[
                { label: "День 1", value: 100, open: 95, high: 105, low: 90, close: 100 },
                { label: "День 2", value: 110, open: 100, high: 115, low: 98, close: 110 },
                { label: "День 3", value: 105, open: 110, high: 112, low: 102, close: 105 },
                { label: "День 4", value: 120, open: 105, high: 125, low: 103, close: 120 },
                { label: "День 5", value: 115, open: 120, high: 122, low: 110, close: 115 }
              ]}
              type="candlestick" 
              title="Динамика цены акций"
              className="border rounded-lg p-4"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Gauge Chart</h3>
            <PlotlyChart 
              data={[
                { label: "Производительность", value: 75 }
              ]}
              type="gauge" 
              title="Показатель эффективности"
              className="border rounded-lg p-4"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Тестирование с пользовательским JSON</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Ввод JSON данных</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
               <Label htmlFor="json-input">JSON данные (объект с полями type и data):</Label>
               <Textarea
                 id="json-input"
                 placeholder='{\n  "type": "funnel",\n  "data": [\n    {"stage": "Посетители сайта", "value": 5000},\n    {"stage": "Регистрация", "value": 3200},\n    {"stage": "Активация аккаунта", "value": 2500},\n    {"stage": "Добавили товар в корзину", "value": 1800},\n    {"stage": "Оформили заказ", "value": 1200},\n    {"stage": "Оплатили заказ", "value": 950}\n  ]\n}'
                 value={customJson}
                 onChange={(e) => setCustomJson(e.target.value)}
                 rows={12}
                 className="font-mono text-sm"
               />
             </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCustomJsonTest} variant="default">
                Создать график
              </Button>
              <Button onClick={fillSampleJson} variant="outline">
                Заполнить примером
              </Button>
            </div>
            
            <div className="space-y-2">
               <Label htmlFor="chart-type">Тип графика (определяется из JSON):</Label>
               <div className="p-2 bg-gray-100 rounded border text-sm">
                 Текущий тип: <span className="font-semibold">{customChartType}</span>
               </div>
             </div>
            
            {jsonError && (
              <div className="text-red-500 text-sm">
                {jsonError}
              </div>
            )}
            
            {customChartData && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Пользовательский график</h3>
                <PlotlyChart 
                  data={customChartData} 
                  type={customChartType as any}
                  title={`Пользовательский ${customChartType} график`}
                  className="border rounded-lg p-4"
                />
              </div>
            )}
          </CardContent>
        </Card>
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