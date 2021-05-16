import React, { ReactElement } from 'react';
import { LazyImage } from '../LazyImage';
import { ProfileLink, ProfileLinkProps } from './ProfileLink';
import classNames from 'classnames';

export function ProfileImageLink({
  className,
  ...props
}: ProfileLinkProps): ReactElement {
  return (
    <ProfileLink
      className={classNames(className, 'block w-10 h-10')}
      {...props}
    >
      <LazyImage
        imgSrc={props.user.image}
        imgAlt={`${props.user.name}'s profile image`}
        background="var(--theme-background-secondary)"
        className="w-full h-full rounded-full"
      />
    </ProfileLink>
  );
}
