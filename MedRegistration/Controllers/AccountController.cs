using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using MedRegistration.Data;
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
//            if (userName == "admin")
//            {
//                User user = new User
//                {
//                    FirstName = "Ventsislav",
//                    LastName = "Mladenov",
//                    Email = "ventsislav.mladenov@gmail.com",
//                    Password = password,
//                    UserName = "admin"
//                };
//                UserManager.StorePassword(user);
//            }
            string message;
            if (UserManager.CheckUserName(userName, password, out message))
            {
                var identity = new ClaimsIdentity(Constants.AuthenticationType);
                identity.AddClaim(new Claim(ClaimTypes.Name, userName));
                identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, userName));
                var user = UserManager.GetUser(userName);
                foreach (var role in user.Roles)
                {
                    identity.AddClaim(new Claim(ClaimTypes.Role, role.Name));
                }

                AuthenticationManager.SignIn(new AuthenticationProperties
                {
                    IsPersistent = rememberme.GetValueOrDefault(false)
                }, identity);
                return RedirectToAction("Index", "Home");
            }
            return RedirectToAction("Login");
        }

        [HttpGet]
        public ActionResult Logout()
        {
            AuthenticationManager.SignOut(Constants.AuthenticationType);
            return RedirectToAction("Login");
        }
    }
}