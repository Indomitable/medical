using System.Linq;
using System.Web.Mvc;
using MedRegistration.Data;
using System.Data.Entity;

namespace MedRegistration.Controllers
{
    public class DoctorController : BaseController
    {
        [HttpGet]
        public ActionResult List()
        {
            using (var context = new DataContext())
            {
                var model = context.Doctors.Include(x => x.Title).ToList();
                return View(model);    
            }
        }

        [HttpGet]
        public ActionResult Add()
        {
            using (var context = new DataContext())
            {
                var model = context.Titles.ToList();
                return PartialView(model);    
            }
        }

        [HttpPost]
        public ActionResult Add(Doctor doctor)
        {
            using (var context = new DataContext())
            {
                context.Doctors.Add(doctor);
                context.SaveChanges();
            }
            return RedirectToAction("List");
        }
    }
}