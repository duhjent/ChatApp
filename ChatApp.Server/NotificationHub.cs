using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.Server
{
    public record SendMessageRequest([Required] string TargetUserName, [Required] string Message);

    public record ChatMessage(DateTime Timestamp, string SenderUserName, string TargetUserName, string Message);

    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly OnlineUsersRepo _onlineUsersRepo;

        public NotificationHub(OnlineUsersRepo onlineUsersRepo)
        {
            _onlineUsersRepo = onlineUsersRepo;
        }

        public async Task NewMessage(SendMessageRequest request)
        {
            var senderUserName = Context.UserIdentifier!;
            var message = new ChatMessage(DateTime.UtcNow, senderUserName, request.TargetUserName, request.Message);

            await Clients.User(request.TargetUserName).SendAsync("receiveMessage", message);
            await Clients.Caller.SendAsync("receiveMessage", message);
        }

        public override async Task OnConnectedAsync()
        {
            if (Context.UserIdentifier != null)
            {
                _onlineUsersRepo.UserOnline(Context.UserIdentifier);
                await Clients.All.SendAsync("usersOnline", _onlineUsersRepo.OnlineUsers);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (Context.UserIdentifier != null)
            {
                _onlineUsersRepo.UserOffline(Context.UserIdentifier);
                await Clients.All.SendAsync("usersOnline", _onlineUsersRepo.OnlineUsers);
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}