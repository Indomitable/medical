using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using MedRegistration.Infrastructure;
using Microsoft.Owin.Security;

namespace MedRegistration.Controllers
{
    public class AccountController : Controller
    {
        private IAuthenticationManager AuthenticationManager
        {
            get
            {
                return HttpContext.GetOwinContext().Authentication;
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public ActionResult Login()
        {
            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        [ValidateAntiForgeryToken]
        public ActionResult Login(string userName, string password, bool? rememberme)
        {
            var identity = new ClaimsIdentity(Constants.AuthenticationType);
            identity.AddClaim(new Claim(ClaimTypes.Name, userName));

            AuthenticationManager.SignIn(new AuthenticationProperties
            {
                IsPersistent = rememberme.GetValueOrDefault(false)
            }, identity);
            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public ActionResult Logout()
        {
            AuthenticationManager.SignOut(Constants.AuthenticationType);
            return RedirectToAction("Login");
        }
    }
}