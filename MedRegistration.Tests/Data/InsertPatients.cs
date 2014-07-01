using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using HtmlAgilityPack;
using MedRegistration.Data;
using NUnit.Framework;

namespace MedRegistration.Tests.Data
{
    [TestFixture]
    class InsertPatients : BaseTest
    {
        [Test]
        public void InsertDymmyPatients()
        {
            var random = new Random();

            using (var context = new DataContext())
            {
                for (int i = 0; i < 1000; i++)
                {
                    Patient patient = new Patient();
                    var rnd = random.Next(1000);
                    var gender = rnd%2 == 0 ? 1 : 2;
                    var name = GetName(gender);
                    patient.FirstName = name.Item1;
                    patient.LastName = name.Item2;
                    patient.GenderId = gender;
                    patient.IdentNumberTypeId = random.Next(1, 3);
                    patient.IdentNumber = random.Next(1000000).ToString("D");
                    patient.PatientPhones.Add(new PatientPhone
                    {
                        TypeId = random.Next(1, 3),
                        IsPrimary = true,
                        Number = random.Next(1000000).ToString("D")
                    });
                    patient.Email = "test@test.com";
                    if (random.Next(1000)%3 == 0)
                    {
                        patient.PatientFundInfo = new PatientFundInfo
                        {
                            FundId = random.Next(1, 3),
                            FundCardExpiration = DateTime.Now,
                            FundCardNumber = random.Next(100000).ToString("D")
                        };
                    }
                    context.Patients.Add(patient);
                }
                context.SaveChanges();
            }
        }

        [Test]
        public Tuple<string, string> GetName(int gender)
        {
            //Use site http://www.behindthename.com/ to generate names use link http://www.behindthename.com/random/random.php?number=2&gender=m&surname=&all=no&usage_bul=1

            string sex = gender == 1 ? "m" : "f";
            var request = (HttpWebRequest)WebRequest.Create(string.Format("http://www.behindthename.com/random/random.php?number=2&gender={0}&surname=&all=no&usage_bul=1", sex));
            var response = request.GetResponse();
            using (var reader = new StreamReader(response.GetResponseStream(), Encoding.UTF8))
            {
                var html = reader.ReadToEnd();
                var doc = new HtmlDocument();
                doc.LoadHtml(html);
                var node = doc.DocumentNode.SelectSingleNode("//span[@class='heavyhuge']");
                var elements = node.Elements("a").ToArray();
                var firstName = WebUtility.HtmlDecode(elements[0].InnerText);
                var lastName = WebUtility.HtmlDecode(elements[1].InnerText);
                return new Tuple<string, string>(firstName, lastName);
            }
        }
    }
}
