# Plotly.js SSR Fix Documentation

## Problem
The application was experiencing a runtime error when using Plotly.js:
```
Error: self is not defined
Call Stack: ./node_modules/plotly.js-dist-min/plotly.min.js
```

## Root Cause
This error occurs because:
1. **Server-Side Rendering (SSR)**: Next.js tries to render components on the server
2. **Browser-only library**: Plotly.js expects browser environment with `window` and `self` objects
3. **Static import**: Direct import of Plotly.js causes it to execute during SSR

## Solution Implemented

### 1. Dynamic Import with Client-Side Check

**Updated `src/components/plotly-chart.tsx`**:
```typescript
// Before (causing SSR error)
import Plotly from 'plotly.js-dist-min';

// After (SSR-safe)
let Plotly: any = null;
if (typeof window !== 'undefined') {
  import('plotly.js-dist-min').then((module) => {
    Plotly = module.default;
  });
}
```

### 2. State Management for Library Loading

**Added loading state**:
```typescript
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
```

### 3. Conditional Rendering

**Added loading indicator**:
```typescript
return (
  <div className={`plotly-chart ${className || ''}`}>
    {!plotlyLoaded ? (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    ) : (
      <div ref={plotRef} style={{ width: '100%', height: '400px' }} />
    )}
  </div>
);
```

### 4. Next.js Dynamic Import Wrapper

**Created `src/components/plotly-chart-wrapper.tsx`**:
```typescript
const DynamicPlotlyChart = dynamic(
  () => import('./plotly-chart').then((mod) => mod.PlotlyChart),
  {
    ssr: false,  // Disable SSR for this component
    loading: () => (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    ),
  }
);
```

### 5. Updated Imports

**Updated components to use wrapper**:
- `src/components/chat-message.tsx`
- `src/app/test-plotly/page.tsx`

```typescript
// Before
import { PlotlyChart } from './plotly-chart';

// After
import { PlotlyChart } from './plotly-chart-wrapper';
```

## Technical Details

### Why This Works

1. **`typeof window !== 'undefined'`**: Ensures code only runs in browser
2. **Dynamic import**: Loads Plotly.js asynchronously after component mounts
3. **`ssr: false`**: Tells Next.js to skip server-side rendering for this component
4. **Loading states**: Provides user feedback while library loads
5. **Error handling**: Gracefully handles import failures

### Performance Considerations

1. **Code splitting**: Plotly.js is only loaded when needed
2. **Lazy loading**: Charts load after initial page render
3. **Caching**: Once loaded, Plotly.js is cached for subsequent use
4. **Fallback UI**: Users see loading indicator instead of broken components

## Files Modified

1. **`src/components/plotly-chart.tsx`**
   - Added dynamic import logic
   - Added loading state management
   - Added conditional rendering
   - Added error handling

2. **`src/components/plotly-chart-wrapper.tsx`** (new)
   - Next.js dynamic import wrapper
   - SSR disabled
   - Loading component

3. **`src/components/chat-message.tsx`**
   - Updated import to use wrapper

4. **`src/app/test-plotly/page.tsx`**
   - Updated import to use wrapper

## Testing

To verify the fix:

1. **Server-side rendering**: No more "self is not defined" errors
2. **Client-side rendering**: Charts load properly after page load
3. **Loading states**: Users see "Loading chart..." while Plotly.js loads
4. **Error handling**: Graceful fallback if Plotly.js fails to load

## Best Practices for SSR with Browser Libraries

1. **Always check environment**: Use `typeof window !== 'undefined'`
2. **Use dynamic imports**: Avoid static imports for browser-only libraries
3. **Implement loading states**: Provide user feedback during async loading
4. **Add error handling**: Handle import failures gracefully
5. **Use Next.js dynamic**: Leverage `next/dynamic` for complex components
6. **Disable SSR when needed**: Use `ssr: false` for browser-only components

## Future Improvements

1. **Preloading**: Consider preloading Plotly.js for faster chart rendering
2. **Bundle optimization**: Use specific Plotly.js modules instead of full bundle
3. **Progressive enhancement**: Provide fallback charts using CSS/SVG
4. **Service worker**: Cache Plotly.js for offline usage