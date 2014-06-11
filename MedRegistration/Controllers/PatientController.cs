using System;
using System.Collections.Generic;
using System.Linq;
using System.Data.Entity;
using System.Web.Mvc;
using MedRegistration.Data;
using MedRegistration.Infrastructure;

namespace MedRegistration.Controllers
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
                               select new
                               {
                                   p.Id,
                                   p.FirstName,
                                   p.LastName,
                                   p.IdentNumber,
                                   PhoneNumber = primaryPhone.Number,
                                   p.Email
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
                        context.PatientPhones.RemoveRange(dbPatient.PatientPhones);
                        foreach (var phone in patient.PatientPhones)
                        {
                            dbPatient.PatientPhones.Add(phone);
                        }

                        if (patient.PatientFundInfo != null)
                        {
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
