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
    
    public partial class ReservationLock
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public System.DateTime LockTime { get; set; }
        public System.DateTime Date { get; set; }
        public System.TimeSpan FromTime { get; set; }
        public System.TimeSpan ToTime { get; set; }
        public int DoctorId { get; set; }
    
        public virtual User User { get; set; }
        public virtual Doctor Doctor { get; set; }
    }
}
