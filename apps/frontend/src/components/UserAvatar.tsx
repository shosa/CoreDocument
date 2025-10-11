'use client';

import { Avatar } from '@mui/material';
import { User } from '@/types';

interface UserAvatarProps {
  user: User;
  size?: number;
}

export default function UserAvatar({ user, size = 40 }: UserAvatarProps) {
  const getInitials = () => {
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const getColor = () => {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2',
    ];
    const charCodeSum = (user.email || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: 'common.white',
        color: 'common.black',
        fontSize: size * 0.4,
        fontWeight: 600,
      }}
    >
      {getInitials()}
    </Avatar>
  );
}
