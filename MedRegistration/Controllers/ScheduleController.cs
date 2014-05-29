using System;
using System.Collections.Generic;
using System.Linq;
using System.Data.Entity;
using System.Web.Mvc;
using MedRegistration.Business;
using MedRegistration.Data;

namespace MedRegistration.Controllers
{
    public class ScheduleController : BaseController
    {
        [HttpGet]
        public ActionResult Index(int doctorId)
        {
            using (var context = new DataContext())
            {
                var doctor = context.Doctors.Include(x => x.Title).Single(d => d.Id == doctorId);
                return View(doctor);
            }
        }

        [HttpGet]
        public ActionResult Calendar(int months, int doctorId)
        {
            var calendar = new Calendar(doctorId);
            calendar.Build(months);
            return JsonNet(calendar);
        }


        public class WorkInterval
        {
            public double[] Interval { get; set; }
            public bool NZOK { get; set; }
        }

        [HttpGet]
        public ActionResult GetDate(DateTime date, int doctorId)
        {
            using (var context = new DataContext())
            {
                var schedule = context.Schedules.SingleOrDefault(s => s.DoctorId == doctorId && s.Date == date);
                if (schedule == null)
                    return new EmptyResult();
                return JsonNet(new
                {
                    schedule.Note,
                    Hours = schedule.ScheduleDates.Select(x => new
                    {
                        From = x.FromTime.TotalMinutes / 60,
                        To = x.ToTime.TotalMinutes / 60,
                        NZOK = x.IsNZOK
                    }).ToArray()
                });
            }
        }

        [HttpPost]
        public ActionResult SetHours(List<DateTime> days, List<WorkInterval> intervals, string note, int doctorId)
        {
            using (var context = new DataContext())
            {
                foreach (var day in days)
                {
                    var schedule = context.Schedules.SingleOrDefault(s => s.DoctorId == doctorId && s.Date == day);
                    if (schedule != null)
                    {
                        if (string.IsNullOrEmpty(note) && intervals == null)
                        {
                            context.Schedules.Remove(schedule);
                            context.SaveChanges();
                            return new EmptyResult();
                        }
                        schedule.Note = note;
                        context.ScheduleDates.RemoveRange(schedule.ScheduleDates);
                    }
                    else
                    {
                        schedule = new Schedule {DoctorId = doctorId, Date = day, Note = note };
                        context.Schedules.Add(schedule);
                    }
                    if (intervals != null)
                    {
                        foreach (var interval in intervals)
                        {
                            var scheduleDate = new ScheduleDate();
                            scheduleDate.FromTime = new TimeSpan((int) Math.Floor(interval.Interval[0]), (int) Math.Floor((interval.Interval[0]%1)*60), 0);
                            scheduleDate.ToTime = new TimeSpan((int) Math.Floor(interval.Interval[1]), (int) Math.Floor((interval.Interval[1]%1)*60), 0);
                            scheduleDate.IsNZOK = interval.NZOK;
                            schedule.ScheduleDates.Add(scheduleDate);
                        }
                    }
                    context.SaveChanges();
                }
                
            }
            return new EmptyResult();
        }
    }
}