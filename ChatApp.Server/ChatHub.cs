using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ChatApp.Server
{
    [Authorize]
    public class ChatHub : Hub
    {
        public async Task NewMessage(string targetUserName, string message)
        {
            var uid = Context.UserIdentifier;
            await Clients.User(targetUserName).SendAsync("receiveMessage", uid, message);
        }
    }
}
