using System;
using System.Linq;
using System.Security.Claims;
using System.Security.Principal;
using MedRegistration.Data;

namespace MedRegistration.Infrastructure.Authorization
{
    public static class AuthorizationHelpers
    {
        private static bool HasRole(ClaimsIdentity identity, Roles role)
        {
            return identity.HasClaim(ClaimTypes.Role, Enum.GetName(typeof(Roles), role));
        }

        public static bool IsAdmin(this IPrincipal principal)
        {
            if (!principal.Identity.IsAuthenticated)
                return false;
            var claimIdentity = principal.Identity as ClaimsIdentity;
            if (claimIdentity == null)
                return false;
            return HasRole(claimIdentity, Roles.Admin);
        }

        public static int UserId(this IPrincipal principal)
        {
            if (!principal.Identity.IsAuthenticated)
                return 0;
            var claimIdentity = principal.Identity as ClaimsIdentity;
            if (claimIdentity == null)
                return 0;
            return Convert.ToInt32(claimIdentity.Claims.Single(c => c.Type == ClaimTypes.SerialNumber).Value);
        }

        public static string FullName(this IPrincipal principal)
        {
            if (!principal.Identity.IsAuthenticated)
                return string.Empty;
            var claimIdentity = principal.Identity as ClaimsIdentity;
            if (claimIdentity == null)
                return string.Empty;
            return claimIdentity.Claims.Single(c => c.Type == ClaimTypes.GivenName).Value;
        }
    }
}