import React from 'react';

interface StatCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  colorClass: string;
  currencySymbol: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, amount, icon, colorClass, currencySymbol }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${amount < 0 ? 'text-red-500' : 'text-gray-900'}`}>
          {currencySymbol}{Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h3>
      </div>
      <div className={`p-3 rounded-full ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
};
