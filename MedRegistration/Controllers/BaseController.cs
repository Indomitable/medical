using System.Linq;
using System.Web.Mvc;
using MedRegistration.Data;
using MedRegistration.Infrastructure;

namespace MedRegistration.Controllers
{
    public class BaseController : Controller
    {
        public JsonResult JsonNet<T>(T data) where T : class
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
    }
}