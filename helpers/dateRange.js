const buildDateRange = (query) => {
  // Gunakan timezone Jakarta (+7)
  const getJakartaDate = () => {
    const now = new Date();
    const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return jakartaTime.toISOString().slice(0, 10);
  };

  if (query.start && query.end) {
    return {
      startDate: new Date(`${query.start}T00:00:00+07:00`),
      endDate: new Date(`${query.end}T23:59:59+07:00`)
    };
  }

  if (query.date) {
    return {
      startDate: new Date(`${query.date}T00:00:00+07:00`),
      endDate: new Date(`${query.date}T23:59:59+07:00`)
    };
  }

  const today = getJakartaDate();
  return {
    startDate: new Date(`${today}T00:00:00+07:00`),
    endDate: new Date(`${today}T23:59:59+07:00`)
  };
};

module.exports = buildDateRange;
