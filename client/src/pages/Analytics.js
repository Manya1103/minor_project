import React, { useState, useEffect, useCallback } from "react";
// import { Link } from "react-router-dom";
import { getSummary, getTrends, getPredictions } from "../services/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#667eea",
  "#764ba2",
  "#48bb78",
  "#ed8936",
  "#4299e1",
  "#f56565",
  "#38b2ac",
  "#9f7aea",
];

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, trendsRes, predRes] = await Promise.all([
        getSummary({ period }),
        getTrends({ months: 6 }),
        getPredictions(),
      ]);

      setSummary(summaryRes.data.summary);
      setTrends(trendsRes.data.trends);
      setPredictions(predRes.data.predictions);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="loading">Loading analytics...</div>;

  // Prepare data for charts
  const categoryData = summary?.byCategory
    ? Object.entries(summary.byCategory).map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: data.total,
      }))
    : [];

  const trendData = trends?.monthly
    ? Object.entries(trends.monthly).map(([month, data]) => ({
        month: month.split("-")[1],
        total: data.total,
        count: data.count,
      }))
    : [];

  const predictionData = predictions?.predictions?.byCategory
    ? Object.entries(predictions.predictions.byCategory).map(
        ([name, data]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          predicted: data.predicted,
        })
      )
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="text-gray-600 dark:text-gray-300">
          Loading analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-gray-900 dark:text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
                Spending Insights
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-normal leading-normal">
                An overview of your financial activity
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setPeriod("week")}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg ${
                  period === "week"
                    ? "bg-primary text-white"
                    : "bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                } px-3 sm:px-4 text-xs sm:text-sm font-medium leading-normal`}
              >
                <span className="hidden sm:inline">This Week</span>
                <span className="sm:hidden">Week</span>
              </button>
              <button
                onClick={() => setPeriod("month")}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg ${
                  period === "month"
                    ? "bg-primary text-white"
                    : "bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                } px-3 sm:px-4 text-xs sm:text-sm font-medium leading-normal`}
              >
                <span className="hidden sm:inline">This Month</span>
                <span className="sm:hidden">Month</span>
              </button>
              <button
                onClick={() => setPeriod("year")}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg ${
                  period === "year"
                    ? "bg-primary text-white"
                    : "bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                } px-3 sm:px-4 text-xs sm:text-sm font-medium leading-normal`}
              >
                <span className="hidden sm:inline">Year to Date</span>
                <span className="sm:hidden">Year</span>
              </button>
              <button className="hidden sm:flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 pl-4 pr-3 text-sm font-medium leading-normal">
                <span className="material-symbols-outlined text-lg">
                  calendar_today
                </span>
                <span>Custom Range</span>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col gap-2 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base font-medium leading-normal">
                Total Spending
              </p>
              <p className="text-gray-900 dark:text-white tracking-light text-2xl sm:text-3xl font-bold leading-tight">
                ₹{summary?.total?.toLocaleString() || 0}
              </p>
              <p className="text-green-500 text-xs sm:text-sm font-medium leading-normal flex items-center gap-1">
                <span className="material-symbols-outlined text-base">
                  arrow_upward
                </span>
                <span>+{trends?.growthRate?.toFixed(1) || 0}%</span>
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base font-medium leading-normal">
                Total Transactions
              </p>
              <p className="text-gray-900 dark:text-white tracking-light text-2xl sm:text-3xl font-bold leading-tight">
                {summary?.count || 0}
              </p>
              <p className="text-green-500 text-xs sm:text-sm font-medium leading-normal flex items-center gap-1">
                <span className="material-symbols-outlined text-base">
                  arrow_upward
                </span>
                <span>+{trends?.transactionGrowth || 0}%</span>
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 sm:col-span-2 lg:col-span-1">
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base font-medium leading-normal">
                Average Per Transaction
              </p>
              <p className="text-gray-900 dark:text-white tracking-light text-2xl sm:text-3xl font-bold leading-tight">
                ₹{summary?.average?.toLocaleString() || 0}
              </p>
              <p
                className={`text-xs sm:text-sm font-medium leading-normal flex items-center gap-1 ${
                  trends?.averageGrowth >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {trends?.averageGrowth >= 0
                    ? "arrow_upward"
                    : "arrow_downward"}
                </span>
                <span>
                  {trends?.averageGrowth >= 0 ? "+" : ""}
                  {trends?.averageGrowth?.toFixed(1) || 0}%
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Spending Trends Chart */}
            <div className="lg:col-span-2 flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-white dark:bg-gray-900/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-gray-900 dark:text-white text-base sm:text-lg font-bold leading-normal">
                    Spending Trends
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-normal leading-normal">
                    Last 6 Months
                  </p>
                </div>
              </div>
              <div className="flex min-h-[200px] sm:min-h-[250px] flex-1 -mx-2 sm:mx-0">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-200 dark:stroke-gray-700"
                      />
                      <XAxis
                        dataKey="month"
                        className="text-gray-600 dark:text-gray-400"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis className="text-gray-600 dark:text-gray-400" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgb(255, 255, 255)",
                          border: "1px solid rgb(229, 231, 235)",
                          borderRadius: "0.5rem",
                        }}
                        formatter={(value) => `₹${value.toLocaleString()}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#427cf0"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#427cf0" }}
                        activeDot={{ r: 6 }}
                        name="Total Spending"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-500 dark:text-gray-400">
                    No trend data available
                  </div>
                )}
              </div>
            </div>

            {/* Category Distribution Chart */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-white dark:bg-gray-900/50">
              <p className="text-gray-900 dark:text-white text-base sm:text-lg font-bold leading-normal">
                Category Breakdown
              </p>
              <div className="flex items-center justify-center min-h-[200px] sm:min-h-[250px] my-auto">
                {categoryData.length > 0 ? (
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            percent > 0.1 ? `${name}: ${(percent * 100).toFixed(0)}%` : ""
                          }
                          outerRadius={80}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `₹${value.toLocaleString()}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400">
                    No category data available
                  </div>
                )}
              </div>
              {categoryData.length > 0 && (
                <div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-2">
                  {categoryData.map((category, index) => (
                    <div
                      key={category.name}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="size-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                      <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm truncate">
                        {category.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Predictions */}
          {predictionData.length > 0 && (
            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-white dark:bg-gray-900/50">
              <p className="text-gray-900 dark:text-white text-base sm:text-lg font-bold leading-normal">
                Next Month Predictions
              </p>
              <div className="min-h-[250px] sm:min-h-[300px] -mx-2 sm:mx-0">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={predictionData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-gray-200 dark:stroke-gray-700"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-gray-600 dark:text-gray-400"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis className="text-gray-600 dark:text-gray-400" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgb(255, 255, 255)",
                        border: "1px solid rgb(229, 231, 235)",
                        borderRadius: "0.5rem",
                      }}
                      formatter={(value) => `₹${value.toLocaleString()}`}
                    />
                    <Bar
                      dataKey="predicted"
                      fill="#427cf0"
                      radius={[4, 4, 0, 0]}
                      name="Predicted Amount"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
    </div>
  );
};

export default Analytics;
