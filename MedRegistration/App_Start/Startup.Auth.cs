using MedRegistration.Infrastructure;
using Microsoft.Owin;
using Microsoft.Owin.Security.Cookies;
using Owin;

namespace MedRegistration
{
    public partial class Startup
    {
        public void ConfigureAuth(IAppBuilder app)
        {
            app.UseCookieAuthentication(new CookieAuthenticationOptions
            {
                AuthenticationType = Constants.AuthenticationType,
                LoginPath = new PathString("/Account/Login"),
                LogoutPath = new PathString("/Account/Logout"),
            });
        }
    }
}