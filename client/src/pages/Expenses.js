import React, { useState, useEffect, useContext } from "react";
import { format } from "date-fns";
import {
  getExpenses,
  createExpense,
  deleteExpense,
  scanReceipt,
} from "../services/api";
import { AuthContext } from "../context/AuthContext";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    amount: "",
    category: "other",
    description: "",
    vendor: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log("User not authenticated");
    }
  }, [isAuthenticated]);

  const categories = [
    { name: "Food & Dining", value: "food", color: "bg-orange-500" },
    { name: "Transportation", value: "transport", color: "bg-teal-500" },
    { name: "Entertainment", value: "entertainment", color: "bg-purple-500" },
    { name: "Shopping", value: "shopping", color: "bg-red-500" },
    { name: "Groceries", value: "groceries", color: "bg-green-500" },
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await getExpenses();
      setExpenses(res.data.expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createExpense(formData);
      setShowModal(false);
      setFormData({
        amount: "",
        category: "other",
        description: "",
        vendor: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchExpenses();
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Failed to add expense");
    }
  };

  const handleScanReceipt = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanning(true);
    const fd = new FormData();
    fd.append("receipt", file);

    try {
      const res = await scanReceipt(fd);
      alert(
        `Receipt scanned! Amount: ₹${res.data.expense.amount}, Category: ${res.data.expense.category}`
      );
      fetchExpenses();
    } catch (error) {
      console.error("Error scanning receipt:", error);
      alert("Failed to scan receipt");
    } finally {
      setScanning(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteExpense(id);
        fetchExpenses();
      } catch (error) {
        console.error("Error deleting expense:", error);
      }
    }
  };

  const groupExpensesByDate = (expenses) => {
    const grouped = {};
    expenses.forEach((expense) => {
      const date = format(new Date(expense.date), "MMM dd");
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(expense);
    });
    return grouped;
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      searchQuery === "" ||
      expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedExpenses = groupExpensesByDate(filteredExpenses);
  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <p className="text-gray-900 dark:text-white text-lg">
          Loading expenses...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4 sm:pb-6 px-4 sm:px-6 lg:px-8">
        <p className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight text-gray-900 dark:text-white">
          Expenses
        </p>
        <div className="flex items-center gap-2">
          <button
            className="flex h-10 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111318] p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={() => alert("Voice input feature coming soon!")}
          >
            <span className="material-symbols-outlined text-xl">mic</span>
          </button>
          <label className="flex h-10 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111318] p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <span className="material-symbols-outlined text-xl">
                  qr_code_scanner
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScanReceipt}
                  className="hidden"
                  disabled={scanning}
                />
              </label>
              <button
                onClick={() => setShowModal(true)}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 sm:px-4 text-sm font-semibold text-white hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-xl">add</span>
                <span className="hidden sm:inline">Add Expense</span>
              </button>
            </div>
          </div>

          {/* Layout */}
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12 px-4 sm:px-6 lg:px-8">
            {/* Left Column - Filters */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-4 sm:space-y-6">
              <div>
                <label className="flex h-12 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#282e39]">
                  <div className="text-gray-400 dark:text-[#9da6b9] flex items-center justify-center pl-4">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent px-2 text-sm text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400 dark:placeholder:text-[#9da6b9]"
                    placeholder="Search expenses..."
                  />
                </label>
              </div>

              {/* Category Filter */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111318] p-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Categories
                </h3>
                <div className="mt-4 space-y-3">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory === category.value
                            ? null
                            : category.value
                        )
                      }
                      className={`flex w-full items-center justify-between text-sm font-medium ${
                        selectedCategory === category.value
                          ? "text-primary"
                          : "text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`block size-2.5 rounded-full ${category.color}`}
                        ></span>
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Expenses List */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-4 sm:space-y-6">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111318] p-4 sm:p-5">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Total Expenses for {format(new Date(), "MMMM")}
                </p>
                <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  ₹{totalExpenses.toLocaleString()}
                </p>
              </div>

              {/* Expense List */}
              <div className="space-y-4 sm:space-y-6">
                {Object.entries(groupedExpenses).map(([date, dayExpenses]) => (
                  <div key={date}>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      {date}
                    </h3>
                    <div className="mt-3 divide-y divide-gray-200 dark:divide-gray-800">
                      {dayExpenses.map((expense) => (
                        <div
                          key={expense._id}
                          className="flex items-center justify-between py-3"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <span
                              className={`block size-2.5 shrink-0 rounded-full ${
                                categories.find(
                                  (c) => c.value === expense.category
                                )?.color || "bg-gray-500"
                              }`}
                            ></span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {expense.description ||
                                  expense.vendor ||
                                  "Expense"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {expense.category}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                              -₹{expense.amount.toLocaleString()}
                            </p>
                            <button
                              onClick={() => handleDelete(expense._id)}
                              className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                            >
                              <span className="material-symbols-outlined text-lg sm:text-sm">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredExpenses.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No expenses found
                  </p>
                )}
              </div>
            </div>
          </div>

      {/* Beautiful Tailwind Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-[#1f2937] rounded-lg shadow-xl w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
                Add Expense
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-red-500 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-2.5 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-2.5 text-gray-900 dark:text-gray-100"
                >
                  {[
                    { value: "food", name: "Food & Dining" },
                    { value: "transport", name: "Transportation" },
                    { value: "entertainment", name: "Entertainment" },
                    { value: "shopping", name: "Shopping" },
                    { value: "groceries", name: "Groceries" },
                    { value: "other", name: "Other" },
                  ].map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-2.5 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vendor
                </label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) =>
                    setFormData({ ...formData, vendor: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-2.5 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-2.5 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-lg"
              >
                Add Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
