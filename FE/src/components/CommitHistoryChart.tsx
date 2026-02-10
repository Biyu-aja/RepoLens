import React from 'react';
import Chart from "react-apexcharts";
import type { ApexOptions } from 'apexcharts';

interface TimelineData {
  date: string; // YYYY-MM-DD
  count: number;
}

interface Props {
  data: TimelineData[];
  year?: number;
  month?: number; // 0-indexed
}

const CommitHistoryChart: React.FC<Props> = ({ data, year, month }) => {
  
  // Generate full month days (or range) to ensure continuous timeline with 0s
  // If year/month provided use that, else derive from data range or default to current month
  
  let startDate: Date;
  let endDate: Date;

  if (year !== undefined && month !== undefined) {
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0); // Last day of month
  } else {
      // Fallback if no props provided (e.g. init load)
      // Use range from data or last 30 days
      const d = new Date();
      endDate = new Date(d);
      startDate = new Date(d);
      startDate.setDate(d.getDate() - 30);
  }

  // Create map for quick lookup
  const dataMap = new Map<string, number>();
  data.forEach(item => {
      // Normalize date string just in case
      const d = new Date(item.date).toISOString().split('T')[0];
      dataMap.set(d, item.count);
  });

  const seriesData: { x: number; y: number }[] = [];
  
  // Iterate from start to end date
  const current = new Date(startDate);
  while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      seriesData.push({
          x: current.getTime(),
          y: dataMap.get(dateStr) || 0
      });
      current.setDate(current.getDate() + 1);
  }
  
  const filteredData = seriesData;

  const options: ApexOptions = {
    chart: {
      type: 'line', // Changed from area to line
      height: 350,
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'inherit',
      animations: { enabled: true }
    },
    colors: ['#6366f1'], // Indigo 500
    stroke: {
      width: 4 // Thicker line
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: { colors: '#9ca3af', fontSize: '12px' },
        format: 'dd' // Only day number e.g. 01, 02
      },
      tooltip: { enabled: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: { show: true, stroke: { color: '#ffffff', dashArray: 4 } }
    },
    yaxis: {
      show: true,
      labels: { style: { colors: '#9ca3af' } },
      min: 0
    },
    theme: { mode: 'dark' },
    grid: {
      borderColor: '#1f2937', 
      strokeDashArray: 2, // Dotted grid lines like reference
      xaxis: { lines: { show: true } }, // Show vertical grid lines too
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 20, bottom: 0, left: 20 }
    },
    tooltip: {
      theme: 'dark',
      x: { format: 'dd MMM yyyy' },
      y: {
        formatter: (val: number) => `${val} contributions`
      },
      marker: { show: false } // Custom tooltip style usually better without default marker
    },
    markers: {
        size: 6, // Visible dots
        colors: ['#1e1e2e'], // Dark center
        strokeColors: '#6366f1', // Indigo border
        strokeWidth: 3,
        hover: { size: 8, sizeOffset: 3 }
    },
    dataLabels: { enabled: false }
  };

  const series = [{
    name: 'Contributions',
    data: filteredData.length > 0 ? filteredData : seriesData.slice(-30) // Fallback to last 30 points if filter empty
  }];

  return (
    <div className="w-full bg-[#0d1117] p-6 rounded-xl border border-white/5">
       <div className="mb-4 text-center">
        <h3 className="text-sm font-medium text-indigo-400">Contribution Activity (Last 30 Days)</h3>
       </div>
       <div id="chart-timeline">
            <Chart 
                options={options} 
                series={series} 
                type="line" 
                height={350} 
            />
       </div>
    </div>
  );
};

export default CommitHistoryChart;
