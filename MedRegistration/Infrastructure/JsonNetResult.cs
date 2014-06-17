using System;
using System.Text;
using System.Web.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace MedRegistration.Infrastructure
{
    public class JsonNetResult<T> : JsonResult
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

            if (!typeof(T).IsValueType && data == null)
                return;

            JsonSerializerSettings settings = new JsonSerializerSettings { Formatting = Formatting.None };
            settings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
            settings.ContractResolver = new CamelCasePropertyNamesContractResolver();
            var serializedObject = JsonConvert.SerializeObject(data, settings);
            response.Write(serializedObject);
        }
    }

    public class LowerCasePropertyNamesContractResolver : DefaultContractResolver
    {
        public LowerCasePropertyNamesContractResolver()
            : base(true)
        {
        }

        protected override string ResolvePropertyName(string propertyName)
        {
            if (!string.IsNullOrWhiteSpace(propertyName))
                return propertyName.ToLowerInvariant();
            else
                return string.Empty;
        }
    }
}