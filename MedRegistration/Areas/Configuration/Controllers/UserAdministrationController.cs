using System;
using System.Linq;
using System.Web.Mvc;
using System.Data.Entity;
using MedRegistration.Controllers;
using MedRegistration.Data;
using MedRegistration.Infrastructure;
using MedRegistration.Infrastructure.Authorization;

namespace MedRegistration.Areas.Configuration.Controllers
{
    [AdminCheck]
    public class UserAdministrationController : BaseController
    {
        [HttpGet]
        public ActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public ActionResult Add()
        {
            return PartialView();
        }

        [HttpGet]
        public ActionResult GetUsers()
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                var users = context.Users.Include(u => u.Roles).ToList();
                return JsonNet(users);
            }
        }

        [HttpGet]
        public ActionResult GetRoles()
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                var roles = context.Roles.ToList();
                return JsonNet(roles);
            }
        }

        [HttpGet]
        public ActionResult GetUser(int id)
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                var user = context.Users.Include(u => u.Roles).SingleOrDefault(x => x.Id == id);
                return JsonNet(user);
            }
        }

        [HttpPost]
        public ActionResult Save(User user, int[] roles)
        {
            try
            {
                using (var context = new DataContext())
                {
                    if (user.Id == 0)
                    {
                        context.Users.Add(user);
                    }
                    else
                    {
                        var dbUser = context.Users.SingleOrDefault(d => d.Id == user.Id);
                        if (dbUser == null)
                            return JsonNet(new { result = 3 });
                        dbUser.UserName = user.UserName;
                        var hash = UserManager.HashPassword(user.Password);
                        dbUser.Password = hash.Item1;
                        dbUser.Salt = hash.Item2;
                        dbUser.FirstName = user.FirstName;
                        dbUser.LastName = user.LastName;
                        dbUser.Email = user.Email;

                        dbUser.Roles.Clear();
                    }
                    context.SaveChanges();

                    var rolesUser = context.Users.Single(d => d.Id == user.Id);
                    if (roles != null)
                    {
                        foreach (var roleId in roles)
                        {
                            var role = context.Roles.Single(s => s.Id == roleId);
                            rolesUser.Roles.Add(role);
                        }
                    }
                    context.SaveChanges();
                }
                return JsonNet(new { result = 1 });
            }
            catch (Exception)
            {
                return JsonNet(new { result = 2 });
            }
        }
    }
}