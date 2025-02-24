import { useContext, useMemo, useState } from 'react';
import { Post } from '../graphql/posts';
import { postAnalyticsEvent } from '../lib/feed';
import AnalyticsContext from '../contexts/AnalyticsContext';
import { ShareProvider } from '../lib/share';
import { Origin } from '../lib/analytics';
import { Comment, getCommentHash } from '../graphql/comments';

export function useShareComment(origin: Origin): {
  shareComment: Comment;
  openShareComment: (comment: Comment, post: Post) => void;
  closeShareComment: () => void;
} {
  const { trackEvent } = useContext(AnalyticsContext);
  const [shareModal, setShareModal] = useState<Comment>(null);

  return useMemo(
    () => ({
      shareComment: shareModal,
      openShareComment: async (comment, post) => {
        if ('share' in navigator) {
          try {
            await navigator.share({
              text: `${post.title}\n${post.commentsPermalink}${getCommentHash(
                comment.id,
              )}`,
            });
            trackEvent(
              postAnalyticsEvent('share post', post, {
                extra: {
                  origin,
                  provider: ShareProvider.Native,
                  commentId: comment.id,
                },
              }),
            );
          } catch (err) {
            // Do nothing
          }
        } else {
          setShareModal(comment);
        }
      },
      closeShareComment: () => setShareModal(null),
    }),
    // @NOTE see https://dailydotdev.atlassian.net/l/cp/dK9h1zoM
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shareModal],
  );
}
