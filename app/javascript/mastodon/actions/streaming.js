import { connectStream } from '../stream';
import {
  updateTimeline,
  deleteFromTimelines,
  expandHomeTimeline,
  connectTimeline,
  disconnectTimeline,
} from './timelines';
import { updateNotifications, expandNotifications } from './notifications';
import { updateConversations } from './conversations';
import { fetchFilters } from './filters';
import { getLocale } from '../locales';

const { messages } = getLocale();
const pawooListeners = Object.create(null);

export function pawooAddListener(timelineId, listener) {
  if (pawooListeners[timelineId]) {
    pawooListeners[timelineId].add(listener);
  } else {
    pawooListeners[timelineId] = new Set([listener]);
  }
}

// TODO: 消す
export function pawooRemoveListener(timelineId, listener) {
  if (pawooListeners[timelineId]) {
    if (pawooListeners[timelineId].size > 1) {
      pawooListeners[timelineId].delete(listener);
    } else {
      delete pawooListeners[timelineId];
    }
  }
}

export function connectTimelineStream (timelineId, path, pollingRefresh = null, accept = null) {

  return connectStream (path, pollingRefresh, (dispatch, getState) => {
    const locale = getState().getIn(['meta', 'locale']);

    return {
      onConnect() {
        dispatch(connectTimeline(timelineId));
      },

      onDisconnect() {
        dispatch(disconnectTimeline(timelineId));
      },

      onReceive (data) {
        switch(data.event) {
        case 'update':
          dispatch(updateTimeline(timelineId, JSON.parse(data.payload), accept));
          break;
        case 'delete':
          dispatch(deleteFromTimelines(data.payload));
          break;
        case 'notification':
          dispatch(updateNotifications(JSON.parse(data.payload), messages, locale));
          break;
        case 'conversation':
          dispatch(updateConversations(JSON.parse(data.payload)));
          break;
        case 'filters_changed':
          dispatch(fetchFilters());
          break;
        }
      },
    };
  });
}

const refreshHomeTimelineAndNotification = (dispatch, done) => {
  dispatch(expandHomeTimeline({}, () => dispatch(expandNotifications({}, done))));
};

export const connectUserStream      = () => connectTimelineStream('home', 'user', refreshHomeTimelineAndNotification);
export const connectCommunityStream = ({ onlyMedia } = {}) => connectTimelineStream(`community${onlyMedia ? ':media' : ''}`, `public:local${onlyMedia ? ':media' : ''}`);
export const connectPublicStream    = ({ onlyMedia } = {}) => connectTimelineStream(`public${onlyMedia ? ':media' : ''}`, `public${onlyMedia ? ':media' : ''}`);
export const connectHashtagStream   = (id, tag, accept) => connectTimelineStream(`hashtag:${id}`, `hashtag&tag=${tag}`, null, accept);
export const connectDirectStream    = () => connectTimelineStream('direct', 'direct');
export const connectListStream      = id => connectTimelineStream(`list:${id}`, `list&list=${id}`);
