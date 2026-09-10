import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import './goalprogresschart.css';

const GoalProgressChart = ({ data = [] }) => {
  return (
    <div className="goal-chart-container">
      <div className="goal-chart-header">
        <h3>Goal Progress</h3>
        <select>
          <option>Weekly</option>
          <option>Monthly</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barCategoryGap="20%" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
          <XAxis dataKey="day" stroke="#888" />
          <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} stroke="#888" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(30,30,30,0.9)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 15,
            }}
          />
          <Legend verticalAlign="bottom" height={36} />
          <Bar dataKey="workout" fill="#00d4b1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="calories" fill="#ff8c42" radius={[4, 4, 0, 0]} />
          <Bar dataKey="steps" fill="#8e44ad" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GoalProgressChart;
