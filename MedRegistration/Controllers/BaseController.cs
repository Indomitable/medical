using System.Linq;
using System.Web.Mvc;
using MedRegistration.Data;
using MedRegistration.Infrastructure;

namespace MedRegistration.Controllers
{
    [Authorize]
    public class BaseController : Controller
    {
        public JsonResult JsonNet<T>(T data)
        {
            return new JsonNetResult<T>(data);
        }

        public ActionResult GetFunds()
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                return JsonNet(context.Funds.Where(f => f.Id > 0).Select(f => new { f.Id, f.Name }).ToList());
            }
        }

        public ActionResult GetTitles()
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                return JsonNet(context.Titles.Select(f => new { f.Id, f.Abr, f.Description }).ToList());
            }
        }

        public ActionResult GetSpecialities()
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                return JsonNet(context.Specialities.Select(s => new { s.Id, s.Description }).ToList());
            }
        }
    }
}