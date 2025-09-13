'use client';

import React from 'react';
import { JsonTable } from '@/components/json-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Примеры данных для тестирования
const sampleData1 = [
  {
    id: 1,
    name: 'Иван Петров',
    age: 28,
    email: 'ivan@example.com',
    isActive: true,
    salary: 75000,
    department: 'IT'
  },
  {
    id: 2,
    name: 'Мария Сидорова',
    age: 32,
    email: 'maria@example.com',
    isActive: false,
    salary: 85000,
    department: 'HR'
  },
  {
    id: 3,
    name: 'Алексей Козлов',
    age: 25,
    email: 'alex@example.com',
    isActive: true,
    salary: 65000,
    department: 'Marketing'
  }
];

const sampleData2 = [
  {
    product: 'Ноутбук',
    price: 89999,
    inStock: true,
    categories: ['Электроника', 'Компьютеры'],
    specs: {
      cpu: 'Intel i7',
      ram: '16GB',
      storage: '512GB SSD'
    },
    rating: 4.5
  },
  {
    product: 'Смартфон',
    price: 45999,
    inStock: false,
    categories: ['Электроника', 'Мобильные'],
    specs: {
      display: '6.1"',
      camera: '48MP',
      battery: '3000mAh'
    },
    rating: 4.2
  }
];

const complexData = [
  {
    id: 'order_001',
    customer: {
      name: 'Петр Иванов',
      email: 'petr@example.com'
    },
    items: [
      { name: 'Товар 1', quantity: 2 },
      { name: 'Товар 2', quantity: 1 }
    ],
    total: 15999,
    status: 'completed',
    createdAt: '2024-01-15',
    metadata: null
  }
];

export default function TestTablePage() {
  const [currentExample, setCurrentExample] = React.useState(1);
  const [customJson, setCustomJson] = React.useState('');
  const [customData, setCustomData] = React.useState(null);
  const [jsonError, setJsonError] = React.useState('');

  const getCurrentData = () => {
    switch (currentExample) {
      case 1:
        return sampleData1;
      case 2:
        return sampleData2;
      case 3:
        return complexData;
      case 4:
        return customData;
      default:
        return sampleData1;
    }
  };

  const getCurrentTitle = () => {
    switch (currentExample) {
      case 1:
        return 'Данные сотрудников';
      case 2:
        return 'Данные товаров';
      case 3:
        return 'Сложные данные заказов';
      case 4:
        return 'Пользовательские данные';
      default:
        return 'Данные сотрудников';
    }
  };

  const getCurrentMessage = () => {
    switch (currentExample) {
      case 1:
        return 'Информация о сотрудниках компании';
      case 2:
        return 'Каталог товаров с ценами';
      case 3:
        return 'Детальная информация о заказах';
      case 4:
        return 'Данные загружены из пользовательского JSON';
      default:
        return 'Информация о сотрудниках компании';
    }
  };

  const handleJsonSubmit = () => {
    try {
      setJsonError('');
      const parsed = JSON.parse(customJson);
      if (Array.isArray(parsed)) {
        setCustomData(parsed);
        setCurrentExample(4);
      } else {
        setJsonError('JSON должен содержать массив объектов');
      }
    } catch (error) {
      setJsonError('Неверный формат JSON: ' + (error as Error).message);
    }
  };

  const sampleJsonExamples = {
    users: `[
  {
    "id": 1,
    "name": "Анна Иванова",
    "email": "anna@example.com",
    "age": 25,
    "isActive": true
  },
  {
    "id": 2,
    "name": "Петр Сидоров",
    "email": "petr@example.com",
    "age": 30,
    "isActive": false
  }
]`,
    products: `[
  {
    "name": "Телефон",
    "price": 25000,
    "category": "Электроника",
    "inStock": true,
    "rating": 4.5
  },
  {
    "name": "Книга",
    "price": 500,
    "category": "Литература",
    "inStock": false,
    "rating": 4.8
  }
]`,
    orders: `[
  {
    "orderId": "ORD-001",
    "customer": "Мария Петрова",
    "amount": 1500,
    "status": "delivered",
    "date": "2024-01-15",
    "items": ["Товар 1", "Товар 2"]
  }
]`
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Тестирование компонента JsonTable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={currentExample === 1 ? 'default' : 'outline'}
              onClick={() => setCurrentExample(1)}
            >
              Сотрудники
            </Button>
            <Button
              variant={currentExample === 2 ? 'default' : 'outline'}
              onClick={() => setCurrentExample(2)}
            >
              Товары
            </Button>
            <Button
              variant={currentExample === 3 ? 'default' : 'outline'}
              onClick={() => setCurrentExample(3)}
            >
              Заказы
            </Button>
            <Button
              variant={currentExample === 4 ? 'default' : 'outline'}
              onClick={() => setCurrentExample(4)}
            >
              Пользовательский JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Интерфейс для пользовательского JSON */}
      <Card>
        <CardHeader>
          <CardTitle>Тестирование с пользовательским JSON</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="json-input" className="text-white">Введите JSON массив объектов:</Label>
            <Textarea
              id="json-input"
              placeholder="Введите JSON данные здесь..."
              value={customJson}
              onChange={(e) => setCustomJson(e.target.value)}
              className="mt-2 min-h-[200px] font-mono text-white"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleJsonSubmit} className="bg-blue-600 hover:bg-blue-700">
              Загрузить данные
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCustomJson(sampleJsonExamples.users)}
              className="text-white border-white hover:bg-white hover:text-black"
            >
              Пример: Пользователи
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCustomJson(sampleJsonExamples.products)}
              className="text-white border-white hover:bg-white hover:text-black"
            >
              Пример: Товары
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCustomJson(sampleJsonExamples.orders)}
              className="text-white border-white hover:bg-white hover:text-black"
            >
              Пример: Заказы
            </Button>
          </div>
          
          {jsonError && (
            <div className="text-red-400 text-sm mt-2">
              {jsonError}
            </div>
          )}
        </CardContent>
      </Card>

      <JsonTable
        data={getCurrentData()}
        title={getCurrentTitle()}
        message={getCurrentMessage()}
        showRowNumbers={true}
        maxRows={50}
      />

      {/* Пример с пустыми данными */}
      <JsonTable
        data={[]}
        title="Пустая таблица"
        message={{
          type: 'info',
          content: 'Это пример таблицы без данных'
        }}
      />

      {/* Пример с неверными данными */}
      <JsonTable
        data={null as any}
        title="Неверные данные"
        message={{
          type: 'error',
          content: 'Произошла ошибка при загрузке данных'
        }}
      />
    </div>
  );
}