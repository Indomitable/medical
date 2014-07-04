using System;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;

namespace MedRegistration.Infrastructure.Hubs
{
    [HubName("reservationHub")]
    public class ReservationHub : Hub
    {
        public void SendReservationMade(int doctorId, DateTime date, TimeSpan fromTime, TimeSpan toTime)
        {
            Clients.All.sendReservationMade(doctorId, date, fromTime, toTime);
        }

        public void SendReservationRemoved(int doctorId, DateTime date, TimeSpan fromTime, TimeSpan toTime)
        {
            Clients.All.sendReservationRemoved(doctorId, date, fromTime, toTime);
        }
    }
}