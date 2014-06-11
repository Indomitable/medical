using System;
using System.Linq;
using System.Web.Mvc;
using MedRegistration.Data;
using System.Data.Entity;
using MedRegistration.Infrastructure;

namespace MedRegistration.Controllers
{
    public class DoctorController : BaseController
    {
        [HttpGet]
        public ActionResult List()
        {
            return View();
        }

        [HttpGet]
        public ActionResult GetDoctors()
        {
            using (var context = new DataContext())
            {
                var doctors = from d in context.Doctors.Include(x => x.Title)
                              select new
                              {
                                  d.Id,
                                  Title = d.Title.Description,
                                  d.FirstName,
                                  d.LastName
                              };
                return JsonNet(doctors.ToList());
            }
        }

        [HttpGet]
        public ActionResult GetDoctor(int id)
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                var doctors = from d in context.Doctors.Include(x => x.Title)
                              where d.Id == id
                              select d;
                return JsonNet(doctors.SingleOrDefault());
            }
        }

        [HttpGet]
        public ActionResult Add()
        {
            return PartialView();
        }

        [HttpPost]
        [AntiForgeryValidate]
        public ActionResult Save(Doctor doctor)
        {
            try
            {
                using (var context = new DataContext())
                {
                    if (doctor.Id == 0)
                    {
                        context.Doctors.Add(doctor);
                    }
                    else
                    {
                        var dbDoctor = context.Doctors.SingleOrDefault(d => d.Id == doctor.Id);
                        if (dbDoctor == null)
                            return JsonNet(new { result = 3 });
                        dbDoctor.TitleId = doctor.TitleId;
                        dbDoctor.FirstName = doctor.FirstName;
                        dbDoctor.LastName = doctor.LastName;
                        dbDoctor.DefaultExamTime = doctor.DefaultExamTime;
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
                    var doctor = context.Doctors.SingleOrDefault(p => p.Id == id);
                    if (doctor != null)
                        context.Doctors.Remove(doctor);
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