namespace MedRegistration.Data
{
    public partial class DataContext
    {
        public DataContext(bool lazyLoading)
            : this()
        {
            this.Configuration.LazyLoadingEnabled = lazyLoading;
        }
    }
}