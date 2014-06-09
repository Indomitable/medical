using System;
using System.Collections.Generic;
using System.Linq;
using System.Data.Entity;
using System.Web.Mvc;
using MedRegistration.Data;

namespace MedRegistration.Controllers
{
    public class PatientController : Controller
    {
        [HttpGet]
        public ActionResult List()
        {
            using (var context = new DataContext())
            {
                var model = context.Patients.Include(x => x.PatientPhones).ToList();
                return View(model);
            }
        }

        [HttpGet]
        public ActionResult Add()
        {
            return PartialView();
        }

        [HttpPost]
        public ActionResult Save(Patient patient)
        {
            return new EmptyResult();
        }
    }
}