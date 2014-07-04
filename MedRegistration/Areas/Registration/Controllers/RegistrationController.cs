using System;
using System.Data.Entity;
using System.Data.Entity.ModelConfiguration.Conventions;
using System.Linq;
using System.Web.Mvc;
using MedRegistration.Controllers;
using MedRegistration.Data;
using MedRegistration.Infrastructure;
using MedRegistration.Infrastructure.Authorization;
using MedRegistration.Infrastructure.Hubs;
using Microsoft.AspNet.SignalR;

namespace MedRegistration.Areas.Registration.Controllers
{
    public class RegistrationController : BaseController
    {
        private static readonly object unRegisterLocker = new object();
        private static readonly object lockHourLocker = new object();
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
        public ActionResult GetReservations(DateTime fromDate, DateTime toDate, int? doctorId, TimeSpan? fromTime, TimeSpan? toTime)
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                var query = from r in context.Reservations
                    where fromDate <= r.Date && r.Date <= toDate 
                       && (!doctorId.HasValue || r.DoctorId == doctorId.Value)
                       && (!fromTime.HasValue || r.FromTime == fromTime.Value)
                       && (!toTime.HasValue || r.ToTime == toTime.Value)
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
                    BroadCastReservationMade(reservation.DoctorId, reservation.Date, reservation.FromTime, reservation.ToTime);
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
                    BroadCastReservationMade(reservation.DoctorId, reservation.Date, reservation.FromTime, reservation.ToTime);
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
            lock (unRegisterLocker)
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
                        BroadCastReservationRemoved(reservation.DoctorId, reservation.Date, reservation.FromTime, reservation.ToTime);
                        return JsonNet(1);
                    }
                }
                catch
                {
                    return JsonNet(2);
                }
            }
        }

        [HttpPost]
        public ActionResult LockReservation(int doctorId, DateTime date, TimeSpan fromTime, TimeSpan toTime)
        {
            lock (lockHourLocker)
            {
                using (var context = new DataContext())
                {
                    try
                    {
                        var reservation = context.Reservations.SingleOrDefault(rl => rl.DoctorId == doctorId && rl.Date == date.Date && rl.FromTime == fromTime && rl.ToTime == toTime);
                        if (reservation != null)
                            return JsonNet(new { result = 3 });
                        var reservationLock = context.ReservationLocks.SingleOrDefault(rl => rl.DoctorId == doctorId && rl.Date == date.Date && rl.FromTime == fromTime && rl.ToTime == toTime);
                        if (reservationLock == null)
                        {
                            var newLock = new ReservationLock
                            {
                                UserId = HttpContext.User.UserId(), 
                                DoctorId = doctorId, 
                                Date = date, 
                                FromTime = fromTime, 
                                ToTime = toTime
                            };
                            context.ReservationLocks.Add(newLock);
                            context.SaveChanges();
                            return JsonNet(new { result = 1 });
                        }
                        else
                        {
                            var user = reservationLock.User;
                            return JsonNet(new
                            {
                                result = 0,
                                lockedByUser = user.FullName
                            });
                        }
                    }
                    catch
                    {
                        return JsonNet(new { result = 2 });
                    }
                }
            }
        }

        [HttpPost]
        public ActionResult UnLockReservation(int doctorId, DateTime date, TimeSpan fromTime, TimeSpan toTime)
        {
            lock (lockHourLocker)
            {
                using (var context = new DataContext())
                {
                    try
                    {
                        var reservationLock = context.ReservationLocks.SingleOrDefault(rl => rl.DoctorId == doctorId && rl.Date == date.Date && rl.FromTime == fromTime && rl.ToTime == toTime);
                        if (reservationLock != null)
                        {
                            context.ReservationLocks.Remove(reservationLock);
                            context.SaveChanges();
                        }
                        return JsonNet(new { result = 1 });
                    }
                    catch
                    {
                        return JsonNet(new { result = 2 });
                    }
                }
            }
        }

        private void BroadCastReservationMade(int doctorId, DateTime date, TimeSpan fromTime, TimeSpan toTime)
        {
            IHubContext context = GlobalHost.ConnectionManager.GetHubContext<ReservationHub>();
            context.Clients.All.SendReservationMade(doctorId, date, fromTime, toTime);
        }

        private void BroadCastReservationRemoved(int doctorId, DateTime date, TimeSpan fromTime, TimeSpan toTime)
        {
            IHubContext context = GlobalHost.ConnectionManager.GetHubContext<ReservationHub>();
            context.Clients.All.SendReservationRemoved(doctorId, date, fromTime, toTime);
        }
    }
}