using System;
using System.Text;
using System.Web.Mvc;
using Newtonsoft.Json;

namespace MedRegistration.Infrastructure
{
    public class JsonNetResult<T> : JsonResult
        where T : class
    {
        private readonly T data;

        public JsonNetResult(T data)
        {
            this.data = data;
            JsonRequestBehavior = JsonRequestBehavior.AllowGet;
        }

        public override void ExecuteResult(ControllerContext context)
        {
            if (context == null)
                throw new ArgumentNullException("context");

            var response = context.HttpContext.Response;
            response.ContentType = "application/json";
            response.ContentEncoding = Encoding.UTF8;

            if (data == null)
                return;

            JsonSerializerSettings settings = new JsonSerializerSettings { Formatting = Formatting.None };
            var serializedObject = JsonConvert.SerializeObject(data, settings);
            response.Write(serializedObject);
        }
    }
}