using System;
using System.Collections.Generic;
using System.Linq;
using System.Data.Entity;
using MedRegistration.Data;

namespace MedRegistration.Business
{
    public class Day
    {
        private readonly DateTime date;
        private readonly List<Schedule> schedules;

        public Day(DateTime date, List<Schedule> schedules)
        {
            this.date = date;
            this.schedules = schedules;
        }

        public int Status
        {
            get
            {
                if (this.date == DateTime.MinValue)
                    return -1;
                var schedule = schedules.FirstOrDefault(s => s.Date == date);
                if (schedule == null)
                    return 0;
                if (schedule.ScheduleDates.Any())
                    return 1;
                return 2;
            }
        }

        public DateTime? Date { get { return date == DateTime.MinValue ? (DateTime?)null : date; } }

        public static Day EmptyDay { get { return new Day(DateTime.MinValue, null); } }
    }

    public class Week
    {
        public const int WeekDays = 7;

        private readonly List<Day> days = new List<Day>();

        public List<Day> Days { get { return days; } }
    }

    public class Month
    {
        private readonly List<Week> weeks = new List<Week>();

        public Month(DateTime date)
        {
            var culture = new System.Globalization.CultureInfo("bg-BG");
            this.Name = culture.TextInfo.ToTitleCase(date.ToString("MMMM", culture));
        }

        public string Name { get; private set; }

        public DateTime AddWeek(DateTime fromDate, DateTime toDate, List<Schedule> schedules)
        {
            var week = new Week();
            DateTime currentDate = fromDate;
            if (fromDate.Day == 1)
                week.Days.AddRange(Enumerable.Repeat(Day.EmptyDay, fromDate.WeekDay()));
            for (int i = fromDate.WeekDay(); i < Week.WeekDays; i++)
            {
                currentDate = fromDate.AddDays(i - fromDate.WeekDay());
                week.Days.Add(new Day(currentDate, schedules));
                if (currentDate == toDate || currentDate.AddDays(1).Day == 1)
                {
                    week.Days.AddRange(Enumerable.Repeat(Day.EmptyDay, Week.WeekDays - currentDate.WeekDay() - 1));
                    Weeks.Add(week);
                    return currentDate;
                }
            }
            Weeks.Add(week);
            return currentDate;
        }

        public List<Week> Weeks { get { return weeks; } }
    }

    public static class DateTimeHelper
    {
        public static int WeekDay(this DateTime date)
        {
            if (date.DayOfWeek == DayOfWeek.Sunday)
                return 6;
            return (int)date.DayOfWeek - 1;
        }
    }

    public class Calendar
    {
        private readonly int doctorId;
        private readonly List<Month> months = new List<Month>();

        public Calendar(int doctorId)
        {
            this.doctorId = doctorId;
        }

        private Month AddMonth(DateTime date)
        {
            var month = new Month(date);
            this.months.Add(month);
            return month;
        }

        public void Build(int months)
        {
            var fromDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
            var toDate = DateTime.Today.AddMonths(months);
            using (var context = new DataContext())
            {
                var schedules = context.Schedules.Include(x => x.ScheduleDates).Where(s => s.DoctorId == doctorId && s.Date >= fromDate && s.Date <= toDate).ToList();
                var currentDate = fromDate;
                var month = this.AddMonth(currentDate);
                currentDate = month.AddWeek(fromDate, toDate, schedules).AddDays(1);
                while (currentDate < toDate)
                {
                    if (currentDate.Day == 1)
                        month = this.AddMonth(currentDate);
                    currentDate = month.AddWeek(currentDate, toDate, schedules).AddDays(1);
                }
            }
        }


        public List<Month> Months { get { return months; } }
    }
}