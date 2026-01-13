import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Badge,
  Drawer,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useChat } from '../../context/ChatContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const Sidebar = () => {
  const {
    user,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    onlineUsers,
    fetchChats,
    notification,
    setNotification,
    themeMode,
    toggleTheme,
  } = useChat();

  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [groupChatName, setGroupChatName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupSearchResult, setGroupSearchResult] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);

  useEffect(() => {
    if (user?.token) {
      fetchChats();
    }
  }, [fetchChats, user]);

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      setSearchResult([]);
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(`/api/users?search=${query}`, config);
      setSearchResult(data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const accessChat = async (userId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      };

      const { data } = await axios.post('/api/chat', { userId }, config);
      
      if (!chats.find(chat => chat._id === data._id)) {
        setChats([data, ...chats]);
      }
      
      setSelectedChat(data);
      setSearch('');
      setSearchResult([]);
    } catch (error) {
      console.error('Error accessing chat:', error);
    }
  };

  const handleGroupSearch = async (query) => {
    setGroupSearch(query);
    if (!query) {
      setGroupSearchResult([]);
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(`/api/users?search=${query}`, config);
      setGroupSearchResult(data.filter(u => !selectedUsers.find(su => su._id === u._id)));
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleRemoveUserFromGroup = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  const handleGroupSubmit = async () => {
    if (!groupChatName || selectedUsers.length < 2) {
      alert('Please fill all fields and select at least 2 users');
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        '/api/chat/group',
        {
          name: groupChatName,
          users: JSON.stringify(selectedUsers.map(u => u._id)),
        },
        config
      );

      setChats([data, ...chats]);
      setSelectedChat(data);
      setOpenGroupDialog(false);
      setGroupChatName('');
      setSelectedUsers([]);
      setGroupSearch('');
      setGroupSearchResult([]);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Error creating group chat');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
    window.location.reload();
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getSender = (chat) => {
    return chat.users.find(u => u._id !== user._id);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Chats</Typography>
          <IconButton onClick={(e) => setProfileAnchorEl(e.currentTarget)}>
            <Avatar src={user?.profilePicture} sx={{ width: 32, height: 32 }}>
              {user?.name?.charAt(0)}
            </Avatar>
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Search users..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
          />
          <IconButton onClick={() => setOpenGroupDialog(true)}>
            <GroupAddIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Chats List */}
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {searchResult.length > 0 ? (
          // Search Results
          searchResult.map((user) => (
            <ListItem
              key={user._id}
              button
              onClick={() => accessChat(user._id)}
            >
              <ListItemAvatar>
                <Badge
                  color="success"
                  variant="dot"
                  invisible={!onlineUsers.includes(user._id)}
                >
                  <Avatar src={user.profilePicture}>
                    {user.name.charAt(0)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={user.name}
                secondary={user.email}
              />
            </ListItem>
          ))
        ) : (
          // Regular Chats
          chats.map((chat) => {
            const sender = getSender(chat);
            const isSelected = selectedChat?._id === chat._id;
            const unreadCount = notification.filter(
              n => n.chat._id === chat._id
            ).length;

            return (
              <ListItem
                key={chat._id}
                button
                selected={isSelected}
                onClick={() => {
                  setSelectedChat(chat);
                  setNotification(notification.filter(n => n.chat._id !== chat._id));
                }}
                sx={{
                  bgcolor: isSelected ? 'action.selected' : 'transparent',
                }}
              >
                <ListItemAvatar>
                  <Badge
                    color="success"
                    variant="dot"
                    invisible={!onlineUsers.includes(
                      chat.isGroupChat ? null : sender?._id
                    )}
                  >
                    <Avatar
                      src={chat.isGroupChat ? chat.groupImage : sender?.profilePicture}
                    >
                      {chat.isGroupChat 
                        ? chat.chatName.charAt(0)
                        : sender?.name.charAt(0)
                      }
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" noWrap>
                        {chat.isGroupChat ? chat.chatName : sender?.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {moment(chat.updatedAt).format('hh:mm A')}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {chat.latestMessage
                        ? `${chat.latestMessage.sender.name}: ${chat.latestMessage.content.substring(0, 30)}...`
                        : 'Start a conversation'
                      }
                    </Typography>
                  }
                />
                {unreadCount > 0 && (
                  <Badge badgeContent={unreadCount} color="primary" sx={{ ml: 2 }} />
                )}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuClick(e, chat);
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </ListItem>
            );
          })
        )}
      </List>

      {/* Group Chat Dialog */}
      <Dialog open={openGroupDialog} onClose={() => {
        setOpenGroupDialog(false);
        setGroupChatName('');
        setSelectedUsers([]);
        setGroupSearch('');
        setGroupSearchResult([]);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Create Group Chat</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={groupChatName}
            onChange={(e) => setGroupChatName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedUsers.map((user) => (
                <Chip
                  key={user._id}
                  label={user.name}
                  onDelete={() => handleRemoveUserFromGroup(user._id)}
                  deleteIcon={<CloseIcon />}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          )}

          <TextField
            margin="dense"
            label="Search Users"
            fullWidth
            value={groupSearch}
            onChange={(e) => handleGroupSearch(e.target.value)}
            placeholder="Type to search users..."
          />
          
          <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
            {groupSearchResult.map((searchUser) => (
              <ListItem
                key={searchUser._id}
                button
                onClick={() => {
                  if (!selectedUsers.find(u => u._id === searchUser._id)) {
                    setSelectedUsers([...selectedUsers, searchUser]);
                    setGroupSearch('');
                    setGroupSearchResult([]);
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar src={searchUser.profilePicture}>
                    {searchUser.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={searchUser.name} secondary={searchUser.email} />
              </ListItem>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenGroupDialog(false);
            setGroupChatName('');
            setSelectedUsers([]);
            setGroupSearch('');
            setGroupSearchResult([]);
          }}>Cancel</Button>
          <Button onClick={handleGroupSubmit} variant="contained" disabled={!groupChatName || selectedUsers.length < 2}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={() => setProfileAnchorEl(null)}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1">{user?.name}</Typography>
          <Typography variant="caption" color="textSecondary">{user?.email}</Typography>
        </Box>
        <MenuItem onClick={() => {
          toggleTheme();
          setProfileAnchorEl(null);
        }}>
          {themeMode === 'dark' ? (
            <LightModeIcon sx={{ mr: 1 }} fontSize="small" />
          ) : (
            <DarkModeIcon sx={{ mr: 1 }} fontSize="small" />
          )}
          {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </MenuItem>
        <MenuItem onClick={() => {
          setProfileAnchorEl(null);
          handleLogout();
        }}>
          <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
          Logout
        </MenuItem>
      </Menu>

      {/* Chat Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>View Profile</MenuItem>
        <MenuItem onClick={handleMenuClose}>Mute Notifications</MenuItem>
        <MenuItem onClick={handleMenuClose}>Clear Chat</MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          Delete Chat
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Sidebar;
