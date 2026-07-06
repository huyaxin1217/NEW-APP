export const getNextReviewTime = (level: number) => {
  const intervals = [
    5 * 60 * 1000, // 5 minutes
    30 * 60 * 1000, // 30 minutes
    12 * 60 * 60 * 1000, // 12 hours
    24 * 60 * 60 * 1000, // 1 day
    2 * 24 * 60 * 60 * 1000, // 2 days
    4 * 24 * 60 * 60 * 1000, // 4 days
    7 * 24 * 60 * 60 * 1000, // 7 days
    15 * 24 * 60 * 60 * 1000 // 15 days
  ];
  const interval = intervals[Math.min(level, Math.max(0, intervals.length - 1))];
  return Date.now() + interval;
};
