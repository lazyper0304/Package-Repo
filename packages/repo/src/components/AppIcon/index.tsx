import React from 'react';
import emptyIcon from '@/assets/empty.svg';

type IProps = Readonly<{
  iconUrl?: string;
  style?: React.CSSProperties;
  className?: string;
}>

const AppIcon: React.FC<IProps> = ({ iconUrl, style, className }) => {
  return (
    <img
      loading="lazy"
      src={iconUrl && iconUrl !== '-' ? iconUrl : emptyIcon}
      style={{
        background: iconUrl && iconUrl !== '-' ? 'transparent' : '#d0d0d060',
        ...style,
      }}
      className={className}
    />
  );
};

export default React.memo(AppIcon);