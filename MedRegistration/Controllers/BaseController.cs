using System.Web.Mvc;
using MedRegistration.Infrastructure;

namespace MedRegistration.Controllers
{
    public class BaseController : Controller
    {
        public JsonResult JsonNet<T>(T data) where T : class
        {
            return new JsonNetResult<T>(data);
        }
    }
}