//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace MedRegistration.Data
{
    using System;
    using System.Collections.Generic;
    
    public partial class PatientPhone
    {
        public int Id { get; set; }
        public int PatientId { get; set; }
        public string Number { get; set; }
        public int TypeId { get; set; }
        public bool IsPrimary { get; set; }
    
        public virtual Patient Patient { get; set; }
        public virtual PhoneType PhoneType { get; set; }
    }
}
