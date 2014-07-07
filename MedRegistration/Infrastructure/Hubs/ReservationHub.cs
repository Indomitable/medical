using System;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;

namespace MedRegistration.Infrastructure.Hubs
{
    [HubName("reservationHub")]
    public class ReservationHub : Hub
    {
        public void SendReservationMade(int doctorId, DateTime date, TimeSpan fromTime, TimeSpan toTime,
                                        int reservationId, int patientId, string firstName, string lastName, string note, string phone, 
                                        string userName)
        {
            Clients.All.sendReservationMade(doctorId, date, fromTime, toTime, reservationId, patientId, firstName, lastName, note, phone, userName);
        }

        public void SendReservationRemoved(int doctorId, DateTime date, TimeSpan fromTime, TimeSpan toTime)
        {
            Clients.All.sendReservationRemoved(doctorId, date, fromTime, toTime);
        }
    }
}