using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using System.Web.Mvc.Filters;

namespace MedRegistration.Infrastructure.Authorization
{
    public class AdminCheckAttribute : ActionFilterAttribute, IAuthenticationFilter//AuthorizeAttribute
    {
//        public override void OnAuthorization(AuthorizationContext filterContext)
//        {
//            base.OnAuthorization(filterContext);
//        }
        public void OnAuthentication(AuthenticationContext filterContext)
        {
            if (!filterContext.Principal.IsAdmin())
                filterContext.Result = new HttpUnauthorizedResult();
        }

        public void OnAuthenticationChallenge(AuthenticationChallengeContext filterContext)
        {
            
        }
    }
}