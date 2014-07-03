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
    
    public class UserAdministrationController : BaseController
    {
        private static readonly object locker = new object();

        [HttpGet]
        [AdminCheck]
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
                if (user == null)
                    return new EmptyResult();
                return JsonNet(new
                {
                    user.UserName,
                    user.FirstName,
                    user.LastName,
                    user.Email,
                    user.Roles
                });
            }
        }

        [HttpGet]
        public ActionResult GetUserByName(string userName)
        {
            using (var context = new DataContext(lazyLoading: false))
            {
                var user = context.Users.SingleOrDefault(x => x.UserName == userName);
                return JsonNet(user);
            }
        }

        [HttpPost]
        [AntiForgeryValidate]
        public ActionResult Save(User user, int[] roles, int changePassword)
        {
            try
            {
                using (var context = new DataContext())
                {
                    if (user.Id == 0)
                    {
                        var hash = UserManager.HashPassword(user.Password);
                        user.Password = hash.Item1;
                        user.Salt = hash.Item2;
                        context.Users.Add(user);
                    }
                    else
                    {
                        var dbUser = context.Users.SingleOrDefault(d => d.Id == user.Id);
                        if (dbUser == null)
                            return JsonNet(new { result = 3 });
                        dbUser.UserName = user.UserName;
                        if (changePassword == 1)
                        {
                            var hash = UserManager.HashPassword(user.Password);
                            dbUser.Password = hash.Item1;
                            dbUser.Salt = hash.Item2;
                        }
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

        [HttpPost]
        [AntiForgeryValidate]
        public ActionResult Delete(int id)
        {
            lock (locker)
            {
                try
                {
                    using (var context = new DataContext())
                    {
                        var user = context.Users.SingleOrDefault(p => p.Id == id);
                        if (user != null)
                        {
                            user.Roles.Clear();
                            context.Users.Remove(user);
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

        [HttpGet]
        public ActionResult Edit()
        {
            ViewBag.Id = HttpContext.User.UserId();
            return View();
        }
    }
}