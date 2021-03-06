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
    
    public partial class Patient
    {
        public Patient()
        {
            this.PatientPhones = new HashSet<PatientPhone>();
            this.Reservations = new HashSet<Reservation>();
        }
    
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public string IdentNumber { get; set; }
        public int IdentNumberTypeId { get; set; }
        public int GenderId { get; set; }
        public string Email { get; set; }
        public string Town { get; set; }
        public string PostCode { get; set; }
        public string Address { get; set; }
        public string Note { get; set; }
    
        public virtual Gender Gender { get; set; }
        public virtual IdentificationNumberType IdentificationNumberType { get; set; }
        public virtual PatientFundInfo PatientFundInfo { get; set; }
        public virtual ICollection<PatientPhone> PatientPhones { get; set; }
        public virtual ICollection<Reservation> Reservations { get; set; }
    }
}
