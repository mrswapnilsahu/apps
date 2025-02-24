import React, { ReactElement, useEffect } from 'react';
import classNames from 'classnames';
import { NextSeo } from 'next-seo';
import { InfiniteData, useInfiniteQuery, useMutation } from 'react-query';
import {
  NOTIFICATIONS_QUERY,
  NotificationsData,
  READ_NOTIFICATIONS_MUTATION,
} from '@dailydotdev/shared/src/graphql/notifications';
import {
  pageBorders,
  pageContainerClassNames,
} from '@dailydotdev/shared/src/components/utilities';
import request from 'graphql-request';
import { graphqlUrl } from '@dailydotdev/shared/src/lib/config';
import NotificationItem from '@dailydotdev/shared/src/components/notifications/NotificationItem';
import FirstNotification from '@dailydotdev/shared/src/components/notifications/FirstNotification';
import EnableNotification from '@dailydotdev/shared/src/components/notifications/EnableNotification';
import { useNotificationContext } from '@dailydotdev/shared/src/contexts/NotificationsContext';
import InfiniteScrolling, {
  checkFetchMore,
} from '@dailydotdev/shared/src/components/containers/InfiniteScrolling';
import { useAnalyticsContext } from '@dailydotdev/shared/src/contexts/AnalyticsContext';
import { AnalyticsEvent, Origin } from '@dailydotdev/shared/src/lib/analytics';
import { NotificationType } from '@dailydotdev/shared/src/components/notifications/utils';
import { getLayout as getFooterNavBarLayout } from '../components/layouts/FooterNavBarLayout';
import { getLayout } from '../components/layouts/MainLayout';

import ProtectedPage from '../components/ProtectedPage';

const hasUnread = (data: InfiniteData<NotificationsData>) =>
  data.pages.some((page) =>
    page.notifications.edges.some(({ node }) => !node.readAt),
  );

const Notifications = (): ReactElement => {
  const seo = (
    <NextSeo
      title="Notifications"
      nofollow
      noindex
      titleTemplate="%s | daily.dev"
    />
  );
  const { trackEvent } = useAnalyticsContext();
  const { clearUnreadCount, isSubscribed } = useNotificationContext();
  const { mutateAsync: readNotifications } = useMutation(
    () => request(graphqlUrl, READ_NOTIFICATIONS_MUTATION),
    { onSuccess: clearUnreadCount },
  );
  const queryResult = useInfiniteQuery<NotificationsData>(
    ['notifications'],
    ({ pageParam }) =>
      request(graphqlUrl, NOTIFICATIONS_QUERY, {
        first: 100,
        after: pageParam,
      }),
    {
      getNextPageParam: (lastPage) =>
        lastPage?.notifications?.pageInfo?.hasNextPage &&
        lastPage?.notifications?.pageInfo?.endCursor,
      onSuccess: (data) => {
        if (hasUnread(data)) {
          readNotifications();
        }
      },
    },
  );
  const { isFetchedAfterMount, isFetched, hasNextPage } = queryResult ?? {};

  const length = queryResult?.data?.pages?.length ?? 0;

  const onNotificationClick = (id: string, type: NotificationType) => {
    trackEvent({
      event_name: AnalyticsEvent.ClickNotification,
      target_id: id,
      extra: JSON.stringify({ origin: Origin.NonRealTime, type }),
    });
  };

  useEffect(() => {
    if (!isFetchedAfterMount) {
      return;
    }

    trackEvent({ event_name: AnalyticsEvent.OpenNotificationList });
    // @NOTE see https://dailydotdev.atlassian.net/l/cp/dK9h1zoM
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetchedAfterMount]);

  return (
    <ProtectedPage seo={seo}>
      <main
        className={classNames(pageBorders, pageContainerClassNames, 'pb-12')}
      >
        <EnableNotification />
        <h2
          className="p-6 font-bold typo-headline"
          data-testid="notification_page-title"
        >
          Notifications
        </h2>
        <InfiniteScrolling
          isFetchingNextPage={queryResult.isFetchingNextPage}
          canFetchMore={checkFetchMore(queryResult)}
          fetchNextPage={queryResult.fetchNextPage}
        >
          {length > 0 &&
            queryResult.data.pages.map((page) =>
              page.notifications.edges.reduce(
                (nodes, { node: { id, readAt, type, ...props } }) => {
                  if (
                    isSubscribed &&
                    type === NotificationType.SquadSubscribeNotification
                  ) {
                    return nodes;
                  }

                  nodes.push(
                    <NotificationItem
                      key={id}
                      {...props}
                      type={type}
                      isUnread={!readAt}
                      onClick={() => onNotificationClick(id, type)}
                    />,
                  );

                  return nodes;
                },
                [],
              ),
            )}
          {(!length || !hasNextPage) && isFetched && <FirstNotification />}
        </InfiniteScrolling>
      </main>
    </ProtectedPage>
  );
};

const getNotificationsLayout: typeof getLayout = (...props) =>
  getFooterNavBarLayout(getLayout(...props));

Notifications.getLayout = getNotificationsLayout;

export default Notifications;
