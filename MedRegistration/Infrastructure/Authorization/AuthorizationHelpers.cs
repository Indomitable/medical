using System;
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
    }
}