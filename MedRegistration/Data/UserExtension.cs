namespace MedRegistration.Data
{
    public partial class User
    {
        public string FullName
        {
            get { return FirstName + " " + LastName; }
        }
    }
}