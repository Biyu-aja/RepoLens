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

  const categories: string[] = [];
  const dayCounts: number[] = [];
  
  // Iterate from start to end date
  const current = new Date(startDate);
  while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayLabel = String(current.getDate()).padStart(2, '0'); // "01", "02"
      
      categories.push(dayLabel);
      dayCounts.push(dataMap.get(dateStr) || 0);
      
      current.setDate(current.getDate() + 1);
  }

  const options: ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'inherit',
      animations: { enabled: true }
    },
    colors: ['#6366f1'], 
    stroke: {
      curve: 'smooth',
      width: 4
    },
    xaxis: {
      type: 'category', // Changed to category for strict alignment
      categories: categories,
      labels: {
        style: { colors: '#9ca3af', fontSize: '12px' },
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
      strokeDashArray: 2,
      xaxis: { lines: { show: true } }, 
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 20, bottom: 0, left: 10 }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val: number) => `${val} contributions`
      },
      marker: { show: false }
    },
    markers: {
        size: 6,
        colors: ['#1e1e2e'],
        strokeColors: '#6366f1', 
        strokeWidth: 3,
        hover: { size: 8, sizeOffset: 3 }
    },
    dataLabels: { enabled: false }
  };

  const series = [{
    name: 'Contributions',
    data: dayCounts
  }];

  return (
    <div className="w-full bg-[#0d1117] p-6 rounded-xl border border-white/5">
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
