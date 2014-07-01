using System;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Data.Entity;
using MedRegistration.Data;

namespace MedRegistration.Infrastructure
{
    public static class UserManager
    {
        private static byte[] GetSalt()
        {
            var randomGenerator = new RNGCryptoServiceProvider();
            var buffer = new byte[64];
            randomGenerator.GetBytes(buffer);
            return buffer;
        }

        private static string HashPassword(byte[] password, byte[] salt)
        {
            using (var memory = new MemoryStream())
            {
                memory.Write(password, 0, password.Length);
                memory.Write(salt, 0, salt.Length);
                memory.Flush();
                var alg = SHA512.Create();
                var hash = alg.ComputeHash(memory.ToArray());
                return Convert.ToBase64String(hash);
            }
        }

        private static bool CheckPasswords(string plainPassword, string hashedPassword, string salt)
        {
            var password = Encoding.UTF8.GetBytes(plainPassword);
            var hash = HashPassword(password, Convert.FromBase64String(salt));
            return string.Equals(hash, hashedPassword, StringComparison.OrdinalIgnoreCase);
        }

        internal static bool CheckUserName(string userName, string password, out string message)
        {
            message = string.Empty;
            using (var context = new DataContext())
            {
                
                var user = context.Users.FirstOrDefault(u => u.UserName.ToUpper() == userName.ToUpper());
                if (user == null)
                {
                    message = "Непознат потребител";
                    return false;
                }
                if (CheckPasswords(password, user.Password, user.Salt))
                {
                    return true;
                }
                message = "Грешна парола";
                return false;
            }
        }

        /// <summary>
        /// Get Plain Text password and hash it with salt
        /// </summary>
        /// <param name="password">Plain text password</param>
        /// <returns>
        /// Tuple: First Items is Hashed Password, Second Item is Salt.
        /// </returns>
        internal static Tuple<string, string> HashPassword(string password)
        {
            var salt = GetSalt();
            var hashedPassword = HashPassword(Encoding.UTF8.GetBytes(password), salt);
            return new Tuple<string, string>(hashedPassword, Convert.ToBase64String(salt));
        }

        internal static User GetUser(string userName)
        {
            using (var context = new DataContext())
            {
                return context.Users.Include(x => x.Roles).Single(u => u.UserName.ToUpper() == userName.ToUpper());
            }
        }
    }
}