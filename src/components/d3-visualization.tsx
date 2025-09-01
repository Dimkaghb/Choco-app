'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';

export interface ChartData {
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
}

interface D3VisualizationProps {
  chartData: ChartData;
  className?: string;
}

export function D3Visualization({ chartData, className = '' }: D3VisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hoveredData, setHoveredData] = useState<any>(null);

  // Default dimensions and options with better spacing
  const defaultWidth = chartData.width || 700;
  const defaultHeight = chartData.height || 450;
  const defaultMargin = chartData.options?.margin || { top: 40, right: 40, bottom: 60, left: 70 };
  
  // Modern color schemes
  const modernColorSchemes = {
    primary: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    gradient: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
    professional: ['#2563eb', '#0891b2', '#059669', '#dc2626', '#7c3aed', '#db2777'],
    warm: ['#f97316', '#ef4444', '#ec4899', '#8b5cf6', '#6366f1', '#3b82f6'],
    cool: ['#06b6d4', '#0891b2', '#059669', '#10b981', '#22c55e', '#84cc16']
  };
  
  const defaultColors = chartData.colors || modernColorSchemes.primary;

  const clearSVG = useCallback(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).selectAll("*").remove();
    }
  }, []);

  // Utility functions for modern styling
  const createGradients = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const defs = svg.append('defs');

    // Create gradients for bars and areas
    defaultColors.forEach((color, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `gradient-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0.8);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d3.color(color)?.darker(0.3)?.toString() || color)
        .attr('stop-opacity', 0.9);
    });

    // Create drop shadow filter
    const filter = defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('height', '130%');

    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3);

    filter.append('feOffset')
      .attr('dx', 2)
      .attr('dy', 2)
      .attr('result', 'offset');

    filter.append('feColorMatrix')
      .attr('values', '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .2 0');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    return defs;
  }, [defaultColors]);

  const createTooltip = useCallback((container: HTMLElement) => {
    const tooltip = d3.select(container)
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '10px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.15)');

    return tooltip;
  }, []);

  const formatTooltip = useCallback((d: any, chartType: string) => {
    switch (chartType) {
      case 'bar':
        return `<strong>${d.label || d.name}</strong><br/>Value: ${d.value || d.y}`;
      case 'line':
      case 'area':
      case 'scatter':
        return `<strong>Point</strong><br/>X: ${d.x}<br/>Y: ${d.y}`;
      case 'pie':
        return `<strong>${d.data.label || d.data.name}</strong><br/>Value: ${d.data.value}<br/>Percentage: ${((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1)}%`;
      case 'histogram':
        return `<strong>Range</strong><br/>${d.x0?.toFixed(1)} - ${d.x1?.toFixed(1)}<br/>Count: ${d.length}`;
      default:
        return 'No data';
    }
  }, []);

  const createBarChart = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const { data } = chartData;
    const width = defaultWidth - defaultMargin.left - defaultMargin.right;
    const height = defaultHeight - defaultMargin.top - defaultMargin.bottom;

    // Create gradients and effects
    createGradients(svg);
    
    const g = svg.append('g')
      .attr('transform', `translate(${defaultMargin.left},${defaultMargin.top})`);

    // Create tooltip
    const tooltip = createTooltip(containerRef.current!);

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.label || d.x || d.name))
      .range([0, width])
      .padding(0.15);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value || d.y) as number])
      .nice()
      .range([height, 0]);

    // Modern grid
    if (chartData.options?.showGrid !== false) {
      const gridGroup = g.append('g').attr('class', 'grid-group');
      
      // Horizontal grid lines
      gridGroup.selectAll('.grid-line-horizontal')
        .data(yScale.ticks(6))
        .enter().append('line')
        .attr('class', 'grid-line-horizontal')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', '#f1f5f9')
        .attr('stroke-width', 1)
        .attr('opacity', 0.7);
    }

    // Styled axes
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale).ticks(6));

    // Style axes
    xAxis.selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#64748b')
      .style('font-weight', '500');

    yAxis.selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#64748b')
      .style('font-weight', '500');

    xAxis.select('.domain').attr('stroke', '#e2e8f0');
    yAxis.select('.domain').attr('stroke', '#e2e8f0');

    // Bars with modern styling
    const bars = g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.label || d.x || d.name) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .attr('fill', (d, i) => `url(#gradient-${i % defaultColors.length})`)
      .attr('rx', 4)
      .attr('ry', 4)
      .style('filter', 'url(#drop-shadow)')
      .style('cursor', 'pointer');

    // Add hover effects
    bars
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.8)
          .attr('transform', 'scale(1.02)');
        
        tooltip
          .style('visibility', 'visible')
          .html(formatTooltip(d, 'bar'));
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('transform', 'scale(1)');
        
        tooltip.style('visibility', 'hidden');
      });

    // Animation with modern easing
    if (chartData.options?.animate !== false) {
      bars.transition()
        .duration(1000)
        .ease(d3.easeBackOut.overshoot(1.2))
        .attr('y', d => yScale(d.value || d.y))
        .attr('height', d => height - yScale(d.value || d.y));
    } else {
      bars.attr('y', d => yScale(d.value || d.y))
        .attr('height', d => height - yScale(d.value || d.y));
    }

    // Add value labels on top of bars
    g.selectAll('.bar-label')
      .data(data)
      .enter().append('text')
      .attr('class', 'bar-label')
      .attr('x', d => (xScale(d.label || d.x || d.name) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.value || d.y) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .text(d => d.value || d.y);

  }, [chartData, defaultWidth, defaultHeight, defaultMargin, defaultColors, createGradients, createTooltip, formatTooltip]);

  const createLineChart = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const { data } = chartData;
    const width = defaultWidth - defaultMargin.left - defaultMargin.right;
    const height = defaultHeight - defaultMargin.top - defaultMargin.bottom;

    // Create gradients and effects
    createGradients(svg);
    
    const g = svg.append('g')
      .attr('transform', `translate(${defaultMargin.left},${defaultMargin.top})`);

    // Create tooltip
    const tooltip = createTooltip(containerRef.current!);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x) as [number, number])
      .nice()
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.y) as [number, number])
      .nice()
      .range([height, 0]);

    // Modern grid
    if (chartData.options?.showGrid !== false) {
      const gridGroup = g.append('g').attr('class', 'grid-group');
      
      // Horizontal grid lines
      gridGroup.selectAll('.grid-line-horizontal')
        .data(yScale.ticks(6))
        .enter().append('line')
        .attr('class', 'grid-line-horizontal')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', '#f1f5f9')
        .attr('stroke-width', 1)
        .attr('opacity', 0.7);

      // Vertical grid lines
      gridGroup.selectAll('.grid-line-vertical')
        .data(xScale.ticks(8))
        .enter().append('line')
        .attr('class', 'grid-line-vertical')
        .attr('x1', d => xScale(d))
        .attr('x2', d => xScale(d))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#f1f5f9')
        .attr('stroke-width', 1)
        .attr('opacity', 0.7);
    }

    // Styled axes
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(8));

    const yAxis = g.append('g')
      .call(d3.axisLeft(yScale).ticks(6));

    // Style axes
    xAxis.selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#64748b')
      .style('font-weight', '500');

    yAxis.selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#64748b')
      .style('font-weight', '500');

    xAxis.select('.domain').attr('stroke', '#e2e8f0');
    yAxis.select('.domain').attr('stroke', '#e2e8f0');

    // Line generator with smooth curve
    const line = d3.line<any>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveCardinal.tension(0.3));

    // Create gradient area under the line
    const area = d3.area<any>()
      .x(d => xScale(d.x))
      .y0(height)
      .y1(d => yScale(d.y))
      .curve(d3.curveCardinal.tension(0.3));

    // Add gradient area
    const areaPath = g.append('path')
      .datum(data)
      .attr('fill', `url(#gradient-0)`)
      .attr('opacity', 0.3)
      .attr('d', area);

    // Line path with modern styling
    const path = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', defaultColors[0])
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', line)
      .style('filter', 'url(#drop-shadow)');

    // Animation
    if (chartData.options?.animate !== false) {
      const totalLength = path.node()?.getTotalLength() || 0;
      
      // Animate area
      areaPath
        .attr('opacity', 0)
        .transition()
        .duration(1500)
        .attr('opacity', 0.3);

      // Animate line
      path
        .attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1500)
        .ease(d3.easeQuadInOut)
        .attr('stroke-dashoffset', 0);
    }

    // Enhanced dots with hover effects
    const dots = g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 0)
      .attr('fill', '#ffffff')
      .attr('stroke', defaultColors[0])
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .style('filter', 'url(#drop-shadow)');

    // Animate dots
    if (chartData.options?.animate !== false) {
      dots.transition()
        .delay((d, i) => i * 100)
        .duration(500)
        .attr('r', 5);
    } else {
      dots.attr('r', 5);
    }

    // Add hover effects to dots
    dots
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 8)
          .attr('stroke-width', 4);
        
        tooltip
          .style('visibility', 'visible')
          .html(formatTooltip(d, 'line'));
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 5)
          .attr('stroke-width', 3);
        
        tooltip.style('visibility', 'hidden');
      });

  }, [chartData, defaultWidth, defaultHeight, defaultMargin, defaultColors, createGradients, createTooltip, formatTooltip]);

  const createPieChart = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const { data } = chartData;
    const width = defaultWidth;
    const height = defaultHeight;
    const radius = Math.min(width, height) / 2 - 40;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3.pie<any>()
      .value(d => d.value || d.y)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter().append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => defaultColors[i % defaultColors.length])
      .transition()
      .duration(800)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t)) || '';
        };
      });

    // Labels
    if (chartData.options?.showLegend !== false) {
      arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('dy', '0.35em')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text(d => d.data.label || d.data.name);
    }
  }, [chartData, defaultWidth, defaultHeight, defaultColors]);

  const createScatterPlot = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const { data } = chartData;
    const width = defaultWidth - defaultMargin.left - defaultMargin.right;
    const height = defaultHeight - defaultMargin.top - defaultMargin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${defaultMargin.left},${defaultMargin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x) as [number, number])
      .nice()
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.y) as [number, number])
      .nice()
      .range([height, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Dots
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('r', d => d.size || 5)
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('fill', (d, i) => d.color || defaultColors[i % defaultColors.length])
      .attr('opacity', 0.7);
  }, [chartData, defaultWidth, defaultHeight, defaultMargin, defaultColors]);

  const createAreaChart = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const { data } = chartData;
    const width = defaultWidth - defaultMargin.left - defaultMargin.right;
    const height = defaultHeight - defaultMargin.top - defaultMargin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${defaultMargin.left},${defaultMargin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x) as [number, number])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.y) as number])
      .nice()
      .range([height, 0]);

    // Area generator
    const area = d3.area<any>()
      .x(d => xScale(d.x))
      .y0(height)
      .y1(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Area path
    g.append('path')
      .datum(data)
      .attr('fill', defaultColors[0])
      .attr('opacity', 0.7)
      .attr('d', area);
  }, [chartData, defaultWidth, defaultHeight, defaultMargin, defaultColors]);

  const createHistogram = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const { data } = chartData;
    const width = defaultWidth - defaultMargin.left - defaultMargin.right;
    const height = defaultHeight - defaultMargin.top - defaultMargin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${defaultMargin.left},${defaultMargin.top})`);

    // Extract values for histogram
    const values = data.map(d => d.value || d.x || d.y);

    // Create bins
    const bins = d3.histogram()
      .domain(d3.extent(values) as [number, number])
      .thresholds(20)(values);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(values) as [number, number])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) as number])
      .nice()
      .range([height, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append('g')
      .call(d3.axisLeft(yScale));

    // Bars
    g.selectAll('.bar')
      .data(bins)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.x0 || 0))
      .attr('width', d => Math.max(0, xScale(d.x1 || 0) - xScale(d.x0 || 0) - 1))
      .attr('y', d => yScale(d.length))
      .attr('height', d => height - yScale(d.length))
      .attr('fill', defaultColors[0])
      .attr('opacity', 0.8);
  }, [chartData, defaultWidth, defaultHeight, defaultMargin, defaultColors]);

  const renderChart = useCallback(() => {
    if (!svgRef.current || !chartData.data.length) return;

    clearSVG();

    const svg = d3.select(svgRef.current)
      .attr('width', defaultWidth)
      .attr('height', defaultHeight);

    // Add modern title with styling
    if (chartData.title) {
      svg.append('text')
        .attr('x', defaultWidth / 2)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', '700')
        .style('fill', '#1f2937')
        .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
        .text(chartData.title);
    }

    // Render based on chart type
    switch (chartData.chartType) {
      case 'bar':
        createBarChart(svg);
        break;
      case 'line':
        createLineChart(svg);
        break;
      case 'pie':
        createPieChart(svg);
        break;
      case 'scatter':
        createScatterPlot(svg);
        break;
      case 'area':
        createAreaChart(svg);
        break;
      case 'histogram':
        createHistogram(svg);
        break;
      default:
        console.warn(`Unsupported chart type: ${chartData.chartType}`);
    }

    // Add modern axis labels
    if (chartData.xLabel && chartData.chartType !== 'pie') {
      svg.append('text')
        .attr('x', defaultWidth / 2)
        .attr('y', defaultHeight - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('fill', '#374151')
        .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
        .text(chartData.xLabel);
    }

    if (chartData.yLabel && chartData.chartType !== 'pie') {
      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -defaultHeight / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('fill', '#374151')
        .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
        .text(chartData.yLabel);
    }
  }, [chartData, clearSVG, createBarChart, createLineChart, createPieChart, createScatterPlot, createAreaChart, createHistogram, defaultWidth, defaultHeight]);

  useEffect(() => {
    renderChart();
  }, [renderChart]);

  // Handle resize
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      renderChart();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [renderChart]);

  return (
    <div ref={containerRef} className={`d3-visualization relative ${className}`}>
      <svg ref={svgRef} className="w-full h-auto max-w-full" style={{ background: '#fafafa', borderRadius: '8px' }}>
        {/* SVG content will be rendered by D3 */}
      </svg>
    </div>
  );
}
