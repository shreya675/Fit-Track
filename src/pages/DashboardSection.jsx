import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { Plus, Repeat } from 'lucide-react';

const weightData = [
  { month: 'Oct', weight: 65 },
  { month: 'Nov', weight: 0 },
  { month: 'Dec', weight: 0 },
  { month: 'Jan', weight: 0 },
  { month: 'Feb', weight: 0 },
  { month: 'Mar', weight: 0 },
];

const weeklyData = [
  { name: 'Calories', value: 400 },
  { name: 'Steps', value: 300 },
  { name: 'Workout Time', value: 300 },
];

const COLORS = ['#f87171', '#60a5fa', '#facc15'];

const exercises = [
  { name: 'Band Hip Adductions', type: 'strength' },
  { name: 'Groin and Back Stretch', type: 'stretching' },
  { name: 'Side Lying Groin Stretch', type: 'stretching' },
];

const DashboardSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      {/* Weight Progress */}
      <div className="bg-white shadow-md rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-4">Weight Progress</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weightData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="weight" fill="#4f46e5" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Progress */}
      <div className="bg-white shadow-md rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-4">Weekly Progress</h2>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={weeklyData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              dataKey="value"
            >
              {weeklyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Exercise Suggestions */}
      <div className="bg-white shadow-md rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-4">Exercise Suggestions</h2>
        <div className="space-y-4">
          {exercises.map((exercise, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-sm text-gray-700"
            >
              <div>
                <div className="font-medium text-base text-black">
                  {exercise.name}
                </div>
                <div className="text-purple-600 text-xs">{exercise.type}</div>
              </div>
              <Plus className="text-purple-600 cursor-pointer" size={20} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;
