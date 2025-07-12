import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './weeklychart.css'; // Custom styles

const data = [
  { day: 'Mon', steps: 4000 },
  { day: 'Tue', steps: 6200 },
  { day: 'Wed', steps: 4800 },
  { day: 'Thu', steps: 7100 },
  { day: 'Fri', steps: 5300 },
  { day: 'Sat', steps: 8800 },
  { day: 'Sun', steps: 6200 },
];

const Weeklychart = () => {
  return (
    <div className="steps-chart-container">
      <h3 className="chart-title">Weekly Step Count</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis
            dataKey="day"
            stroke="#ccc"
            interval={0}  // Forces all labels to be shown
            tick={{ fontSize: 12 }}  // Adjust font size if needed
            tickLine={false}  // Optional: removes tick lines
          />

          <YAxis stroke="#ccc" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(20, 20, 20, 0.8)', // subtle dark background
              border: 'none',
              boxShadow: 'none',
              color: '#00ffae',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '8px',
            }}
            cursor={{ fill: 'transparent' }} // removes hover glow on bar
          />



          <Bar dataKey="steps" fill="#00d4b1" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Weeklychart;
