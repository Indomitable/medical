using System;
using System.Linq;
using System.Data.Entity;
using System.Web.Mvc;
using MedRegistration.Data;

namespace MedRegistration.Controllers
{
    public class RegistrationController : BaseController
    {
        [HttpGet]
        public ActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public ActionResult GetDoctorsSchedule(DateTime fromDate, DateTime toDate)
        {
            using (var context = new DataContext())
            {
                context.Configuration.LazyLoadingEnabled = false;
                var query = from sc in context.Schedules
                                .Include(x => x.Doctor.Title)    
                                .Include(x => x.ScheduleDates)
                            where fromDate <= sc.Date && sc.Date <= toDate && sc.ScheduleDates.Any()
                            group sc by sc.Date into gr
                            let minHour = gr.SelectMany(x => x.ScheduleDates).Select(x => x.FromTime).Min()
                            let maxHour = gr.SelectMany(x => x.ScheduleDates).Select(x => x.ToTime).Max()
                            select new
                            {
                                Date = gr.Key,
                                DayMinHour = (int)Math.Floor((minHour.Hours * 60 + minHour.Minutes) / (double)60) * 60,
                                DayMaxHour = (int)Math.Ceiling((maxHour.Hours * 60 + maxHour.Minutes) / (double)60) * 60,
                                Doctors = from g in gr
                                          select new
                                          {
                                                g.DoctorId,
                                                g.Doctor.FirstName, 
                                                g.Doctor.LastName,
                                                ExamTime = g.Doctor.DefaultExamTime,
                                                Title = g.Doctor.Title.Abr,
                                                Schedule = from sc in g.ScheduleDates
                                                            select new
                                                            {
                                                                sc.Id,
                                                                sc.IsNZOK,
                                                                FromTime = sc.FromTime.Hours * 60 + sc.FromTime.Minutes,
                                                                ToTime = sc.ToTime.Hours * 60 + sc.ToTime.Minutes
                                                            }
                                          }
                            };

                var data = query.ToList();
                return JsonNet(new
                {
                    WeekMinHour = data.Min(d => (int?)d.DayMinHour),
                    WeekMaxHour = data.Max(d => (int?)d.DayMaxHour),
                    Schedule = data
                });
            }
        }
    }
}