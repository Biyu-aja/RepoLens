
import React from 'react';
import Chart from "react-apexcharts";
import type { ApexOptions } from 'apexcharts';

interface Props {
  data: number[][]; // [day, hour, count]
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PunchCardGraph: React.FC<Props> = ({ data }) => {
  // Process data for heatmap
  // Heatmap series format: { name: 'Day', data: [{ x: 'Hour', y: Value }] }
  const series = DAYS.map((dayName, dayIndex) => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const point = data.find(d => d[0] === dayIndex && d[1] === hour);
      return {
        x: `${hour}:00`,
        y: point ? point[2] : 0
      };
    });

    return {
      name: dayName,
      data: hourlyData
    };
  }).reverse(); // Reverse so Sunday is top or bottom depending on preference (usually Mon top)
  // Actually let's keep Sunday top -> no reverse, or reverse to match calendar view?
  // Calendar view: Sunday top depending on locale.
  // Standard heatmap often has Y axis 0 at bottom.
  // Let's reverse so Sunday is at the TOP visualy if that's standard, or bottom.
  // ApexCharts renders first series at TOP?
  // Let's test. Usually first series is top. So Sunday top.

  const options: ApexOptions = {
    chart: {
      type: 'heatmap',
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'inherit'
    },
    theme: {
      mode: 'dark' 
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 4,
        useFillColorAsStroke: false,
        colorScale: {
          ranges: [
            { from: 0, to: 0, color: '#161b22', name: 'No Activity' },
            { from: 1, to: 5, color: '#4f46e5', name: 'Low' },       // Indigo 600
            { from: 6, to: 15, color: '#6366f1', name: 'Medium' },    // Indigo 500
            { from: 16, to: 1000, color: '#818cf8', name: 'High' }    // Indigo 400
          ]
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: { width: 1, colors: ['#0d1117'] }, // Grid lines color
    xaxis: {
      labels: { style: { colors: '#9ca3af', fontSize: '10px' } },
      tooltip: { enabled: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { colors: '#9ca3af', fontSize: '11px', fontWeight: 500 } }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val: number, { seriesIndex, dataPointIndex, w }: any) => {
          const day = w.config.series[seriesIndex].name;
          const time = w.config.series[seriesIndex].data[dataPointIndex].x;
          return `${val} commits total on ${day}s at ${time}`;
        }
      }
    },
    grid: {
      padding: { top: 0, right: 0, bottom: 0, left: 10 }
    }
  };

  return (
    <div className="w-full bg-[#0d1117] p-4 rounded-xl border border-white/5">
      <div id="chart">
        <Chart 
            options={options} 
            series={series} 
            type="heatmap" 
            height={350} 
        />
      </div>
    </div>
  );
};

export default PunchCardGraph;
