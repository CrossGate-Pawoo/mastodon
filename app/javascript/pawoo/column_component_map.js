import {
  Compose,
  Notifications,
  HomeTimeline,
  CommunityTimeline,
  PublicTimeline,
  HashtagTimeline,
  DirectTimeline,
  FavouritedStatuses,
  ListTimeline,
  MediaTimeline,
  Status,
  Reblogs,
  Favourites,
} from '../mastodon/features/ui/util/async-components';
import { SuggestionTags } from 'pawoo/util/async-components';
import * as PawooComponents from './util/async-components';

export default {
  'COMPOSE': {
    component: Compose,
    match: null,
  },
  'HOME': {
    component: HomeTimeline,
    match: { path: '/timelines/home' },
  },
  'PUBLIC': {
    component: PublicTimeline,
    match: { path: '/timelines/public' },
  },
  'COMMUNITY': {
    component: CommunityTimeline,
    match: { path: '/timelines/public/local' },
  },
  'HASHTAG': {
    component: HashtagTimeline,
    match: { path: '/timelines/tag/:id' },
  },
  'DIRECT': {
    component: DirectTimeline,
    match: { path: '/timelines/direct' },
  },
  'LIST': {
    component: ListTimeline,
    match: { path: '/timelines/list/:id' },
  },
  'NOTIFICATIONS': {
    component: Notifications,
    match: { path: '/notifications' },
  },
  'FAVOURITES': {
    component: FavouritedStatuses,
    match: { path: '/favourites' },
  },
  'STATUS': {
    component: Status,
    match: { path: '/statuses/:statusId', exact: true },
  },
  'STATUS_REBLOGS': {
    component: Reblogs,
    match: { path: '/statuses/:statusId/reblogs' },
  },
  'STATUS_FAVOURITES': {
    component: Favourites,
    match: { path: '/statuses/:statusId/favourites' },
  },
  'MEDIA': {
    component: MediaTimeline,
    match: { path: '/timelines/public/media' },
  },
  'SUGGESTION_TAGS': {
    component: SuggestionTags,
    match: null,
  },
  'PAWOO_ONBOARDING': {
    component: PawooComponents.OnboardingPageContainer,
    match: null,
  },
  'PAWOO_SUGGESTED_ACCOUNTS': {
    component: PawooComponents.SuggestedAccountsPage,
    match: null,
  },
};
