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
    
    public partial class PaymentInfo
    {
        public PaymentInfo()
        {
            this.Reservations = new HashSet<Reservation>();
        }
    
        public int Id { get; set; }
        public Nullable<int> FundId { get; set; }
        public string FundCardNumber { get; set; }
        public Nullable<System.DateTime> FundCardExpiration { get; set; }
    
        public virtual Fund Fund { get; set; }
        public virtual ICollection<Reservation> Reservations { get; set; }
    }
}
