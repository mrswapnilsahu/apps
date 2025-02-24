import { useContext, useMemo } from 'react';
import useIncrementReadingRank from './useIncrementReadingRank';
import AnalyticsContext from '../contexts/AnalyticsContext';
import { feedAnalyticsExtra, postAnalyticsEvent } from '../lib/feed';
import { Post } from '../graphql/posts';
import { Origin } from '../lib/analytics';

interface PostClickOptionalProps {
  skipPostUpdate?: boolean;
  parent_id?: string;
}

export type FeedPostClick = ({
  post,
  row,
  column,
  optional,
}: {
  post: Post;
  row?: number;
  column?: number;
  optional?: PostClickOptionalProps;
}) => Promise<void>;

interface UseOnPostClickProps {
  eventName?: string;
  columns?: number;
  feedName?: string;
  ranking?: string;
  origin?: Origin;
}
export default function useOnPostClick({
  eventName = 'go to link',
  columns,
  feedName,
  ranking,
  origin,
}: UseOnPostClickProps): FeedPostClick {
  const { trackEvent } = useContext(AnalyticsContext);
  const { incrementReadingRank } = useIncrementReadingRank();

  return useMemo(
    () =>
      async ({ post, row, column, optional }): Promise<void> => {
        trackEvent(
          postAnalyticsEvent(eventName, post, {
            columns,
            column,
            row,
            ...feedAnalyticsExtra(
              feedName,
              ranking,
              null,
              origin,
              null,
              optional?.parent_id,
            ),
          }),
        );

        if (optional?.skipPostUpdate) {
          return;
        }

        if (!post.read) {
          await incrementReadingRank();
        }
      },
    // @NOTE see https://dailydotdev.atlassian.net/l/cp/dK9h1zoM
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, feedName, ranking, origin],
  );
}
