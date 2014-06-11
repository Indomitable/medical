using System;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;

namespace MedRegistration.Infrastructure
{
    public class AntiForgeryValidate : FilterAttribute, IAuthorizationFilter
    {
        private const string AntiForgeryHeaderName = "X-Request-Verification-Token";
        private void ValidateRequestHeader(HttpRequestBase request)
        {
            string formToken = request.Headers[AntiForgeryHeaderName];
            var antiforgeryCookie = request.Cookies[AntiForgeryConfig.CookieName];
            var cookieToken = string.Empty;
            if (antiforgeryCookie != null)
                cookieToken = antiforgeryCookie.Value;
            AntiForgery.Validate(cookieToken, formToken);
        }

        public void OnAuthorization(AuthorizationContext filterContext)
        {
            if (filterContext.HttpContext.Request.IsAjaxRequest())
            {
                ValidateRequestHeader(filterContext.HttpContext.Request);
            }
            else
            {
                AntiForgery.Validate();
            }
        }
    }
}