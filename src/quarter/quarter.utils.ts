export function generate91DayQuarters(year: number) {
  const quarters = [];

  const zeroTime = (date: Date) => {
    date.setHours(0, 0, 0, 0);
    return date;
  };

  let currentStart = zeroTime(new Date(`${year}-01-01`));

  for (let i = 0; i < 4; i++) {
    const start = zeroTime(new Date(currentStart));
    const end = zeroTime(new Date(start));
    end.setDate(end.getDate() + 90); // 91-day quarter

    quarters.push({
      quarter: `q${i + 1}`,
      year,
      start_date: start,
      end_date: end,
      total_days: 91,
    });

    currentStart = new Date(end);
    currentStart.setDate(currentStart.getDate() + 1);
  }

  return quarters;
}
