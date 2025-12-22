const buildDateRange = (query) => {
  if (query.start && query.end) {
    return {
      startDate: new Date(`${query.start}T00:00:00`),
      endDate: new Date(`${query.end}T23:59:59`)
    };
  }

  if (query.date) {
    return {
      startDate: new Date(`${query.date}T00:00:00`),
      endDate: new Date(`${query.date}T23:59:59`)
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  return {
    startDate: new Date(`${today}T00:00:00`),
    endDate: new Date(`${today}T23:59:59`)
  };
};

module.exports = buildDateRange;
