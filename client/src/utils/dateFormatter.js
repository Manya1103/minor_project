import { format } from 'date-fns';

export const formatToIndianDate = (date) => {
  // Format: DD/MM/YYYY
  return format(new Date(date), 'dd/MM/yyyy');
};

export const formatToIndianDateTime = (date) => {
  // Format: DD/MM/YYYY, hh:mm a (e.g., 02/11/2025, 03:30 PM)
  return format(new Date(date), 'dd/MM/yyyy, hh:mm a');
};

export const formatToMonthYear = (date) => {
  // Format: MMMM yyyy (e.g., November 2025)
  return format(new Date(date), 'MMMM yyyy');
};

export const formatToShortMonthDate = (date) => {
  // Format: DD MMM (e.g., 02 Nov)
  return format(new Date(date), 'dd MMM');
};

export const formatToRelativeTime = (date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInDays = Math.floor((targetDate - now) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays === -1) return 'Yesterday';
  if (diffInDays > 0) return `In ${diffInDays} days`;
  return `${Math.abs(diffInDays)} days ago`;
};

export const formatAmount = (amount) => {
  // Format amount in Indian currency format (₹)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};