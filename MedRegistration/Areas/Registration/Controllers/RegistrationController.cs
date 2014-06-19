using System;
using System.Data.Entity;
using System.Linq;
using System.Web.Mvc;
using MedRegistration.Controllers;
using MedRegistration.Data;
using MedRegistration.Infrastructure;

namespace MedRegistration.Areas.Registration.Controllers
{
    public class RegistrationController : BaseController
    {
        private static readonly object locker = new object();
        [HttpGet]
        public ActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public ActionResult GetDoctorsSchedule(DateTime fromDate, DateTime toDate)
        {
            using (var context = new DataContext(lazyLoading: false))
            {
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
                return JsonNet(data);
            }
        }

        [HttpGet]
        public ActionResult GetReservations(DateTime fromDate, DateTime toDate)
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                var query = from r in context.Reservations
                    where fromDate <= r.Date && r.Date <= toDate
                    group r by new { r.Date, r.DoctorId } into gr
                    select new
                    {
                        gr.Key.Date,
                        gr.Key.DoctorId,
                        Hours = from h in gr
                                let patientPhone = h.Patient.PatientPhones.FirstOrDefault(p => p.IsPrimary)
                                select new
                                {
                                    h.Id,
                                    FromTime = h.FromTime.Hours * 60 + h.FromTime.Minutes,
                                    ToTime = h.ToTime.Hours * 60 + h.ToTime.Minutes,
                                    PatientId = h.Patient.Id,
                                    PatientFirstName = h.Patient.FirstName,
                                    PatientLastName = h.Patient.LastName,
                                    h.Note,
                                    PatientPhone = patientPhone.Number
                                }

                    };
                var data = query.ToList();
                return JsonNet(data);
            }
        }

        [HttpGet]
        public ActionResult Register()
        {
            return PartialView();
        }

        [HttpPost]
        [AntiForgeryValidate]
        public ActionResult RegisterExistingPatient(Reservation reservation)
        {
            try
            {
                using (var context = new DataContext())
                {
                    context.Reservations.Add(reservation);
                    if (reservation.PaymentTypeId == 3 && reservation.PaymentInfo != null && reservation.PaymentInfo.FundId.HasValue && reservation.PaymentInfo.FundCardExpiration.HasValue)
                    {
                        var patient = context.Patients.Single(p => p.Id == reservation.PatientId);
                        if (patient.PatientFundInfo == null)
                            patient.PatientFundInfo = new PatientFundInfo();
                        patient.PatientFundInfo.FundId = reservation.PaymentInfo.FundId.Value;
                        patient.PatientFundInfo.FundCardNumber = reservation.PaymentInfo.FundCardNumber;
                        patient.PatientFundInfo.FundCardExpiration = reservation.PaymentInfo.FundCardExpiration.Value;
                    }
                    context.SaveChanges();
                }
                return JsonNet(1);
            }
            catch (Exception ex)
            {
                return JsonNet(new { result = 2, msg = ex.Message });
            }
        }

        [HttpPost]
        [AntiForgeryValidate]
        public ActionResult RegisterNewPatient(Reservation reservation, Patient patient)
        {
            try
            {
                using (var context = new DataContext())
                {
                    if (reservation.PaymentInfo != null)
                    {
                        patient.PatientFundInfo = new PatientFundInfo
                        {
                            FundId = reservation.PaymentInfo.FundId.Value,
                            FundCardNumber = reservation.PaymentInfo.FundCardNumber,
                            FundCardExpiration = reservation.PaymentInfo.FundCardExpiration.Value
                        };
                    }
                    context.Patients.Add(patient);
                    reservation.Patient = patient;
                    context.Reservations.Add(reservation);
                    context.SaveChanges();
                }
                return JsonNet(1);
            }
            catch (Exception ex)
            {
                return JsonNet(new { result = 2, msg = ex.Message });
            }

        }

        [HttpPost]
        public ActionResult UnRegisterHour(int id)
        {
            lock (locker)
            {
                try
                {
                    using (var context = new DataContext())
                    {
                        var reservation = context.Reservations.SingleOrDefault(x => x.Id == id);
                        if (reservation == null)
                            return JsonNet(3);
                        context.Reservations.Remove(reservation);
                        context.SaveChanges();
                        return JsonNet(1);
                    }
                }
                catch
                {
                    return JsonNet(2);
                }
            }
        }
    }
}