namespace ChatApp.Server;

public class OnlineUsersRepo
{
    private List<string> _onlineUsers = [];
    
    public IReadOnlyList<string> OnlineUsers => _onlineUsers;

    public void UserOnline(string username)
    {
        _onlineUsers.Add(username);
    }
    
    public void UserOffline(string username)
    {
        _onlineUsers.Remove(username);
    }

    public bool IsOnline(string username)
    {
        return _onlineUsers.Contains(username);
    }
}