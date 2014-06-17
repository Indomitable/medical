using System;
using System.Data.Entity;
using System.Linq;
using System.Web.Mvc;
using MedRegistration.Controllers;
using MedRegistration.Data;
using MedRegistration.Infrastructure;

namespace MedRegistration.Areas.Common.Controllers
{
    public class PatientController : BaseController
    {
        [HttpGet]
        public ActionResult List()
        {
            return View();
        }

        [HttpGet]
        public ActionResult GetPatients()
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                var patients = from p in context.Patients
                                                .Include(x => x.PatientPhones)
                               let primaryPhone = p.PatientPhones.FirstOrDefault(pp => pp.IsPrimary)
                               orderby p.Reservations.Count() descending 
                               select new
                               {
                                   p.Id,
                                   fn = p.FirstName,
                                   ln = p.LastName,
                                   @in = p.IdentNumber,
                                   pn = primaryPhone.Number,
                                   em = p.Email
                               };
                return JsonNet(patients.ToList());
            }
        }

        [HttpGet]
        public ActionResult GetPatient(int id)
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                var dbPatient = context.Patients
                                       .Where(p => p.Id == id)
                                       .Include(x => x.PatientPhones)
                                       .Include(x => x.PatientFundInfo)
                                       .SingleOrDefault();
                return JsonNet(dbPatient);
            }
        }

        [HttpGet]
        public ActionResult CanBeDeleted(int id)
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                var patient = context.Patients.Where(p => p.Id == id).Include(x => x.Reservations).Single();
                var res = !patient.Reservations.Any();
                return JsonNet(res);
            }
        }

        [HttpGet]
        public ActionResult GetPatientFundInfo(int id)
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                var patient = context.Patients.Where(p => p.Id == id).Include(p => p.PatientFundInfo).Single();
                return JsonNet(patient.PatientFundInfo);
            }
        }

        [HttpGet]
        public ActionResult Add()
        {
            return PartialView();
        }

        [HttpPost]
        [AntiForgeryValidate]
        public ActionResult Save(Patient patient)
        {
            try
            {
                using (var context = new DataContext())
                {
                    if (patient.Id == 0)
                    {
                        context.Patients.Add(patient);
                    }
                    else
                    {
                        var dbPatient = context.Patients
                                               .Where(p => p.Id == patient.Id)
                                               .Include(x => x.PatientPhones)
                                               .Include(x => x.PatientFundInfo)
                                               .SingleOrDefault();
                        if (dbPatient == null)
                            return JsonNet(new { result = 3 });
                        dbPatient.FirstName = patient.FirstName;
                        dbPatient.MiddleName = patient.MiddleName;
                        dbPatient.LastName = patient.LastName;
                        dbPatient.IdentNumberTypeId = patient.IdentNumberTypeId;
                        dbPatient.IdentNumber = patient.IdentNumber;
                        dbPatient.GenderId = patient.GenderId;
                        dbPatient.Email = patient.Email;
                        dbPatient.Address = patient.Address;
                        dbPatient.Town = patient.Town;
                        dbPatient.PostCode = patient.PostCode;
                        dbPatient.Note = patient.Note;
                        context.PatientPhones.RemoveRange(dbPatient.PatientPhones);
                        foreach (var phone in patient.PatientPhones)
                        {
                            dbPatient.PatientPhones.Add(phone);
                        }

                        if (patient.PatientFundInfo != null)
                        {
                            if (dbPatient.PatientFundInfo == null)
                                dbPatient.PatientFundInfo = new PatientFundInfo();
                            dbPatient.PatientFundInfo.FundId = patient.PatientFundInfo.FundId;
                            dbPatient.PatientFundInfo.FundCardNumber = patient.PatientFundInfo.FundCardNumber;
                            dbPatient.PatientFundInfo.FundCardExpiration = patient.PatientFundInfo.FundCardExpiration;
                        }
                        else
                        {
                            if (dbPatient.PatientFundInfo != null)
                                context.PatientFundInfoes.Remove(dbPatient.PatientFundInfo);
                        }
                    }
                    context.SaveChanges();
                }
                return JsonNet(new { result = 1 });
            }
            catch (Exception)
            {
                return JsonNet(new { result = 2 });
            }
        }

        [HttpPost]
        [AntiForgeryValidate]
        public ActionResult Delete(int id)
        {
            try
            {
                using (var context = new DataContext())
                {
                    var patient = context.Patients.SingleOrDefault(p => p.Id == id);
                    if (patient != null)
                        context.Patients.Remove(patient);
                    context.SaveChanges();
                }
                return JsonNet(new { result = 1 });
            }
            catch (Exception)
            {
                return JsonNet(new { result = 2 });
            }
        }
    }
}
