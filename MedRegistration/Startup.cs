using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Owin;

namespace MedRegistration
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            app.MapSignalR();
            ConfigureAuth(app);
        }
    }
}